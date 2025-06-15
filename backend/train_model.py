import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
import pickle

VOCAB_SIZE = 10000
MAX_LEN = 50
EPOCHS = 10
BATCH_SIZE = 64

df = pd.read_csv("emergency_dataset.csv")

texts = df["text"].astype(str).tolist()
labels = df["label"].astype(str).tolist()

tokenizer = Tokenizer(num_words=VOCAB_SIZE, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)
X = pad_sequences(tokenizer.texts_to_sequences(texts), maxlen=MAX_LEN)

label_encoder = LabelEncoder()
y = label_encoder.fit_transform(labels)

model = Sequential([
    Embedding(VOCAB_SIZE, 64, input_length=MAX_LEN),
    LSTM(64, return_sequences=True),
    LSTM(32),
    Dense(32, activation='relu'),
    Dropout(0.3),
    Dense(len(set(labels)), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

model.fit(X, y, epochs=EPOCHS, batch_size=BATCH_SIZE, verbose=1)

model.save("model.h5")
with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)
with open("label_encoder.pkl", "wb") as f:
    pickle.dump(label_encoder, f)

print("Model, tokenizer, and label encoder saved.")
