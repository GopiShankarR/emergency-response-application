import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
import numpy as np
import pickle

class EmergencyClassifier:
    def __init__(self):
        self.max_len = 50
        self.model = tf.keras.models.load_model("model.h5")
        with open("tokenizer.pkl", "rb") as f:
            self.tokenizer = pickle.load(f)
        with open("label_encoder.pkl", "rb") as f:
            self.label_encoder = pickle.load(f)
        self.remedies = self._load_remedies()

    def _load_remedies(self):
        return {
            'unconscious': {
                'steps': ['Check responsiveness', 'Call 911', 'Check breathing', 'Place in recovery position'],
                'warnings': ['Don\'t give food or drink'],
                'call_911': 'Always call 911 for unconscious cases'
            },
            'seizure': {
                'steps': ['Stay Calm', 'Clear the area', 'Cushion head', 'Time seizure'],
                'warnings': ['Do not restrain', 'Do not put anything in mouth'],
                'call_911': 'Call 911 if seizure >5 mins or injured'
            },
            'bleeding': {
                'steps': ['Apply pressure', 'Elevate wound', 'Call 911'],
                'warnings': ['Do not remove embedded objects'],
                'call_911': 'Call 911 for heavy bleeding'
            },
            'breathing_difficulty': {
                'steps': [
                    'Help person sit upright',
                    'Loosen tight clothing',
                    'Assist with inhaler if available',
                    'Call 911 if symptoms worsen'
                ],
                'warnings': ['Don’t let them lie down', 'Avoid crowding'],
                'call_911': 'Call 911 if breathing does not improve quickly'
            },
            'headache': {
                'steps': ['Encourage hydration', 'Dim the lights', 'Apply cold compress'],
                'warnings': ['Seek help if headache is sudden or severe'],
                'call_911': 'Call 911 if headache is accompanied by vision loss or confusion'
            },
            'chest_pain': {
                'steps': ['Have the person sit down', 'Loosen tight clothing', 'Keep them calm'],
                'warnings': ['Do not allow physical activity'],
                'call_911': 'Call 911 immediately for chest pain'
            },
            'stroke': {
                'steps': ['Use FAST test (Face, Arms, Speech, Time)', 'Keep the person still', 'Note symptom start time'],
                'warnings': ['Do not give food or drink'],
                'call_911': 'Call 911 immediately for stroke symptoms'
            },
            'burns': {
                'steps': ['Cool burn with water', 'Cover with sterile cloth', 'Avoid popping blisters'],
                'warnings': ['Do not apply creams or oils'],
                'call_911': 'Call 911 for large or severe burns'
            },
            'allergic_reaction': {
                'steps': ['Use epinephrine if available', 'Call 911', 'Loosen tight clothing'],
                'warnings': ['Watch for breathing difficulty'],
                'call_911': 'Call 911 for severe allergic reactions'
            },
            'poisoning': {
                'steps': ['Call poison control center', 'Do not induce vomiting', 'Keep sample of substance'],
                'warnings': ['Do not give anything to eat or drink unless instructed'],
                'call_911': 'Call 911 if person is unconscious or having trouble breathing'
            }
        }

    def predict(self, text):
        seq = self.tokenizer.texts_to_sequences([text])
        padded = pad_sequences(seq, maxlen=self.max_len)
        preds = self.model.predict(padded, verbose=0)
        idx = np.argmax(preds)
        confidence = float(preds[0][idx])
        label = self.label_encoder.inverse_transform([idx])[0]
        return label, confidence

    def get_remedy(self, user_input):
        label, conf = self.predict(user_input)
        if conf > 0.35:
            remedy = self.remedies.get(label, {})
            return {
                'emergency_type': label,
                'confidence': conf,
                'remedy': remedy,
                'disclaimer': 'This is not medical advice. Call emergency services for serious situations.'
            }
        else:
            return {
                'emergency_type': 'unknown',
                'confidence': conf,
                'message': 'Unable to determine emergency type confidently. When in doubt, call 911.',
                'general_advice': 'Ensure scene safety, check responsiveness, and call for help.'
            }