import sys
import pickle
# Import Pandas
import pandas as pd


# Load Comics Metadata
metadata = pd.read_json('models/mangaList.json')
if sys.argv[1] not in metadata.values :
    print('')
else :
    # Read Similarity file
    cosine_sim = pickle.load(open('models/recommendation_model.pkl', "rb"))

    # Reset index of your main DataFrame and construct reverse mapping as before
    metadata = metadata.reset_index()
    indices = pd.Series(metadata.index, index=metadata['_id'])

    # Function that takes in movie title as input and outputs most similar comics
    def get_recommendations(_id, cosine_sim=cosine_sim):
        # Get the index of the movie that matches the title
        idx = indices[_id]

        # Get the pairwsie similarity scores of all comics with that movie
        similarity_scores = list(enumerate(cosine_sim[idx]))

        # Sort the comics based on the similarity scores
        similarity_scores = sorted(similarity_scores, key=lambda x: x[1], reverse=True)

        # Get the scores of the 10 most similar comics
        similarity_scores = similarity_scores[1:11]

        # Get the movie indices
        comic_indices = [i[0] for i in similarity_scores]

        # Return the top 10 most similar comics
        return ' '.join(metadata['_id'].loc[comic_indices].to_list())

    recommendations=get_recommendations(sys.argv[1])
    print(recommendations)