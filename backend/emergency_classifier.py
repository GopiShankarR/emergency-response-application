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
                'steps': [
                    'Check for responsiveness by tapping and shouting.',
                    'Call 911 immediately if unresponsive.',
                    'Check for breathing and pulse.',
                    'If not breathing, begin CPR.',
                    'If breathing, place in recovery position.'
                ],
                'warnings': [
                    'Do not leave the person alone.',
                    'Do not give them anything by mouth.'
                ],
                'call_911': 'Always call 911 if someone is unconscious.'
            },
            'seizure': {
                'steps': [
                    'Stay calm and ensure the person is safe.',
                    'Gently ease them to the ground if standing.',
                    'Turn them on their side to help with breathing.',
                    'Place something soft under their head.',
                    'Remove glasses and loosen tight clothing.',
                    'Time the seizure. If over 5 minutes, call 911.'
                ],
                'warnings': [
                    'Do not restrain the person.',
                    'Do not put anything in their mouth.',
                    'Do not try to move them unless they are in danger.'
                ],
                'call_911': 'Call 911 if seizure lasts more than 5 minutes, or if it’s the person’s first seizure.'
            },
            'bleeding': {
                'steps': [
                    'Put on gloves if available.',
                    'Apply firm pressure with a clean cloth.',
                    'Elevate the wounded area if possible.',
                    'Add more cloths without removing soaked ones.',
                    'Call 911 if bleeding doesn’t stop or is severe.'
                ],
                'warnings': [
                    'Do not remove embedded objects; stabilize instead.',
                    'Avoid using a tourniquet unless trained.'
                ],
                'call_911': 'Call 911 for heavy or uncontrollable bleeding.'
            },
            'breathing_difficulty': {
                'steps': [
                    'Help the person into a seated, upright position.',
                    'Loosen tight clothing around neck or chest.',
                    'Encourage slow, steady breathing.',
                    'If they have an inhaler or epinephrine, assist them.',
                    'Call 911 if breathing does not improve.'
                ],
                'warnings': [
                    'Do not let them lie down flat.',
                    'Avoid panicking or crowding them.'
                ],
                'call_911': 'Call 911 if breathing does not stabilize quickly.'
            },
            'headache': {
                'steps': [
                    'Encourage rest in a quiet, dark room.',
                    'Provide water to hydrate.',
                    'Apply a cold compress to forehead or neck.',
                    'Encourage breathing exercises or relaxation.'
                ],
                'warnings': [
                    'Seek emergency care if the headache is sudden and severe.',
                    'Watch for confusion, fever, or stiff neck — these may indicate a serious condition.'
                ],
                'call_911': 'Call 911 if headache is accompanied by fainting, confusion, or vision loss.'
            },
            'chest_pain': {
                'steps': [
                    'Help the person sit down and rest.',
                    'Loosen tight clothing.',
                    'Keep the person calm and monitor symptoms.',
                    'Ask if they have prescribed nitroglycerin and help if needed.',
                    'Call 911 immediately.'
                ],
                'warnings': [
                    'Do not allow physical exertion.',
                    'Do not give anything to eat or drink.'
                ],
                'call_911': 'Call 911 immediately for any kind of chest pain.'
            },
            'stroke': {
                'steps': [
                    'Use the FAST method: Face drooping, Arm weakness, Speech difficulty, Time to call 911.',
                    'Keep the person seated or lying flat and calm.',
                    'Note the time symptoms started.',
                    'Do not offer food, water, or medication.'
                ],
                'warnings': [
                    'Do not move the person unless in danger.',
                    'Avoid letting them fall asleep or "walk it off".'
                ],
                'call_911': 'Call 911 immediately if stroke symptoms are observed.'
            },
            'burns': {
                'steps': [
                    'Remove the person from the source of burn.',
                    'Cool the burn with clean, cool (not cold) water for 10–20 minutes.',
                    'Cover loosely with sterile cloth or non-stick dressing.',
                    'Avoid touching or bursting blisters.'
                ],
                'warnings': [
                    'Do not apply butter, oil, or creams.',
                    'Do not use ice directly on burns.'
                ],
                'call_911': 'Call 911 for burns that are large, deep, or on face/hands/genitals.'
            },
            'allergic_reaction': {
                'steps': [
                    'Check for signs of severe reaction: swelling, difficulty breathing.',
                    'Use an epinephrine auto-injector (EpiPen) if available.',
                    'Help them sit upright to breathe easier.',
                    'Call 911 immediately.',
                    'Stay with the person and monitor their condition.'
                ],
                'warnings': [
                    'Do not wait to see if symptoms get worse before calling for help.',
                    'Do not give oral meds unless instructed.'
                ],
                'call_911': 'Call 911 if signs of anaphylaxis are present.'
            },
            'poisoning': {
                'steps': [
                    'Try to identify the poison (label, container, etc.).',
                    'Call Poison Control at 1-800-222-1222 or local emergency services.',
                    'Do not induce vomiting unless told to.',
                    'Monitor for breathing or consciousness changes.',
                    'Keep the substance container for emergency responders.'
                ],
                'warnings': [
                    'Do not give food or drink unless instructed.',
                    'Do not attempt home remedies.'
                ],
                'call_911': 'Call 911 if person is unconscious, having seizures, or trouble breathing.'
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
        if conf > 0.6:
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