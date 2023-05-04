# Import Pandas
import pandas as pd
# Import CountVectorizer
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle


# Load Comics Metadata
metadata = pd.read_json('models/mangaList.json')
# create the count matrix
count = CountVectorizer(stop_words='english')
count_matrix = count.fit_transform(metadata['soup'])

# Compute the Cosine Similarity matrix based on the count_matrix
cosine_sim2 = cosine_similarity(count_matrix, count_matrix)

# Save model to txt file
pickle.dump(cosine_sim2, open('models/recommendation_model.pkl', "wb"))