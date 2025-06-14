from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class OldEmergencyClassifier:
  def __init__(self):
    self.emergency_data = {
      'unconscious': {
        'training_phrases': [
          'person fainted unconscious',
          'someone passed out collapsed',
          'unresponsive not waking up',
          'fell down not moving',
          'person sleeping won\'t wake up'
        ],
        'remedy': {
          'steps': [
            'Check if person is responsive - tap shoulders and shout',
            'Call 911 immediately',
            'Check for breathing - look for chest movement',
            'If breathing normally, place in recovery position',
            'Stay with person until help arrives',
          ],
          'warnings': ['Don\'t give water or food', 'Don\'t leave person alone'],
          'call_911': 'Always call 911 for unconscious person'
        }
      },
      'seizure': {
        'training_phrases': [
          'person having seizure convulsing',
          'shaking uncontrollably epileptic',
          'body jerking movements',
          'convulsions muscle spasms'
        ],
        'remedy': {
          'steps': [
            'Stay calm and stay with the person',
            'Clear area of hard or sharp objects',
            'Cushion their head with something soft',
            'Time the seizure - call 911 if over 5 minutes',
            'Turn on side when seizure stops'
          ],
          'warnings': ['Never put anything in their mouth', 'Don\'t restrain the person'],
          'call_911': 'If seizure lasts >5 minutes or person is injured'
        }
      },
      'bleeding': {
        'training_phrases': [
          'heavy bleeding blood wound',
          'cut injury profuse bleeding',
          'blood loss deep cut',
          'wound bleeding heavily'
        ],
        'remedy': {
          'steps': [
            'Call 911 immediately for heavy bleeding',
            'Apply direct pressure with clean cloth',
            'Don\'t remove cloth - add more layers if soaked',
            'Elevate injured area above heart if possible',
            'Keep person lying down and calm'
          ],
          'warnings': ['Don\'t remove embedded objects', 'Don\'t use tourniquets unless trained'],
          'call_911': 'Always call 911 for heavy bleeding'
        }
      }
    }

    self.vectorizer = TfidfVectorizer(
      ngram_range=(1, 3),
      stop_words='english',
      lowercase=True
    )

    self._train_model()

  def _train_model(self):
    self.training_texts = []
    self.labels = []

    for emergency_type, data in self.emergency_data.items():
      for phrase in data['training_phrases']:
        self.training_texts.append(phrase)
        self.labels.append(emergency_type)
    
    self.tfidf_matrix = self.vectorizer.fit_transform(self.training_texts)

  def classify_emergency(self, user_input, threshold=0.3):
    user_vector = self.vectorizer.transform([user_input.lower()])
    similarities = cosine_similarity(user_vector, self.tfidf_matrix)[0]
    best_match_idx = np.argmax(similarities)
    best_similarity = similarities[best_match_idx]

    if best_similarity > threshold:
      return self.labels[best_match_idx], best_similarity
    else:
      return 'unknown', best_similarity
    
  def get_remedy(self, user_input):
    emergency_type, confidence = self.classify_emergency(user_input)

    if emergency_type != 'unknown':
      remedy = self.emergency_data[emergency_type]['remedy']
      return {
        'emergency_type': emergency_type,
        'confidence': float(confidence),
        'remedy': remedy,
        'disclaimer': 'This is not medical advice. Call emergency services for serious situations'
      }
    else:
      return {
        'emergency_type': 'unknown',
        'confidence': float(confidence),
        'message': 'Unable to determine emergency type. When in doubt, call 911.',
        'general_advice': 'Ensure scene safety, check responsiveness, call for help'
      }
    
classifier = OldEmergencyClassifier()