import re
import numpy as np
import flask
import io
import pickle as pkl

#keras 
import keras
from keras.models import load_model

#natural language toolkit
import nltk 
from nltk.tokenize import RegexpTokenizer
from nltk.corpus import stopwords
from nltk.util import ngrams

#sci-kit learn
from sklearn.feature_extraction.text import TfidfVectorizer, TfidfTransformer

from flask_cors import CORS

# initialize our Flask application and the Keras model
app = flask.Flask(__name__)
CORS(app)
ann_model = None
category_names = ['No Category', 'ABE', 'SPCM', 'NASC', 'ENG', 'PHYS/PHYSICS', 'HUM', 'ARTS', 'ECON', 'PE', 'CHEM', 'ENSC', 'NSTP', 'MATH', 'WIKA', 'HNF', 'FIL', 'AECO', 'STAT', 'CHE', 'HUME', 'ZOO', 'COMM', 'SAIS-Specific', 'Financial Concerns', 'Form Porcessing', 'Batch Appointment', 'System Issues', 'Registration Period', 'Class Permission', 'Plan of Study', 'Guidelines', 'Grades', 'COI', 'Lecture-Lab Concerns', 'Units', 'General Waitlist', 'Explicit Need of Assistance', 'Midyear', 'Misc. Subjects', 'Drop/Cancel']
en_stops = set(stopwords.words('english'))

def load_ann():
    global ann_model
    ann_model = load_model("./assets/ann.h5")

def preprocess_post(post):
    global en_stops
    
    with open("./assets/informal_fil_stopwords.txt") as file:
        tl_stops = set(file.read().splitlines())

    tokenizer = RegexpTokenizer(r'\w+')

    #string preprocessing
    no_stopwords = []

    joined = ''.join(post)
    newLine = joined.replace('\n',' ')
    toLower = joined.lower()
    urlDel = re.sub(r"http\S+", "", toLower)
    noNumber = re.sub(r"[0-9]+.*", "", urlDel)
    tokens = tokenizer.tokenize(noNumber)
    chunked = nltk.ne_chunk(nltk.pos_tag(tokens))
    tokens = [leaf[0] for leaf in chunked if type(leaf) != nltk.Tree]

    for word in tokens: 
        if word not in en_stops and word not in tl_stops:
            if len(word) > 1:
                no_stopwords.append(word)

    output = " ".join(no_stopwords)

    transformer = TfidfTransformer()
    loaded_vectorizer = TfidfVectorizer(max_features=10000, min_df=2, stop_words='english', ngram_range=(1, 3), vocabulary=pkl.load(open("./assets/features.pkl", "rb")))
    tfidf_vector = transformer.fit_transform(loaded_vectorizer.fit_transform(np.array([output])))

    #vectorization
    tfidf_vectorized = tfidf_vector.toarray()

    return tfidf_vectorized, output

# define a predict function as an endpoint 
@app.route("/predict", methods=["GET","POST"])
def predict():
    global ann_model
    data = flask.request.json
    if (data == None):
        data = flask.request.form

    # if data is received 
    if (data != None):
        try:
            post = data["body"]["message"]
            id = data["body"]["id"]
            url = data["body"]["url"]
            date_created = data["body"]["date_created"]

            preprocessed, output_text = preprocess_post(post)

            probabilities = ann_model.predict(preprocessed)
            category_index = np.argmax(probabilities)
            confidence =  np.amax(probabilities) * 100
        except:
            category_index = 0
            confidence =  100.0

    return flask.jsonify({'label_id': str(category_index), 'topic': category_names[category_index],'confidence': str(confidence), 'id': str(id), 'url':str(url), 'date_created':str(date_created), 'message': post})

# main thread of execution, first load the model and then start the server
if __name__ == "__main__":
    print("[!] Loading Keras ANN model and starting Flask server")
    load_ann()
    app.run(threaded=True)
