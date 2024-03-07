from flask import Flask, render_template, jsonify
import pandas as pd
from sklearn.cluster import KMeans
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from logics import generatePCATableData, generateScreePlotData
app = Flask(__name__)


@app.route('/pca-data/<int:n_components>')
def pca_data(n_components):
    # Ensure n_components is within a valid range to avoid errors
    n_components = max(1, min(n_components, 15))
    pcaTableData = generatePCATableData(n_components)
    return pcaTableData


def calculate_wcss(data):
    wcss = []
    for i in range(1, 11):  # Assuming we want to check for 1 to 10 clusters
        kmeans = KMeans(n_clusters=i, init='k-means++', max_iter=300, n_init=10, random_state=0)
        kmeans.fit(data)
        wcss.append(kmeans.inertia_)  # inertia_ is the WCSS for the model
        scaler = MinMaxScaler(feature_range=(0, 100))
        wcss_scaled = scaler.fit_transform(np.array(wcss).reshape(-1, 1)).flatten().tolist()
    
    return wcss_scaled


def biplot():
    df = pd.read_csv('Final_dataset.csv')
    # Assuming the first column 'id' is an identifier
    # Standardize the data excluding any non-feature columns (like IDs)
    scaler = StandardScaler()
    df_scaled = scaler.fit_transform(df.iloc[:, 1:])  # Adjust this as per your dataset

    # Perform PCA to obtain 2 principal components
    pca = PCA(n_components=2)  # Focusing on the first two components for the biplot
    pca_results = pca.fit_transform(df_scaled)

    # Extract the PCA scores (the transformed dataset coordinates in PC space)
    scores = pd.DataFrame(pca_results, columns=['PC1', 'PC2'])

    # Extract the loadings (the contributions of each original variable to the PCs)
    loadings = pd.DataFrame(pca.components_.T, columns=['PC1', 'PC2'], index=df.columns[1:])

    # Perform clustering
    kmeans = KMeans(n_clusters=4, random_state=0).fit(scores)
    scores['cluster'] = kmeans.labels_

    # Preparing data for plotting
    data_for_plot = {
        "scores": scores.to_dict(orient='records'),  # Convert dataframe to list of dicts for plotting
        "loadings": loadings.to_dict(orient='records'),
        "explained_variance_ratio": pca.explained_variance_ratio_.tolist()  # Explained variance ratio of each PC
    }

    return data_for_plot


@app.route('/calculate-wcss')
def get_wcss():
    # Load your dataset here
    data = pd.read_csv('Final_dataset.csv')  # Replace with your actual CSV path
    data_std = StandardScaler().fit_transform(data)
    wcss = calculate_wcss(data_std)
    return jsonify(wcss=wcss)


@app.route('/')
def hello_world():
    variance_explained, cumulative_variance = generateScreePlotData()
    pcaTableData = generatePCATableData(15)
    data_for_plot = biplot()
    print
    return render_template('index.html', variance_explained=variance_explained.tolist(), cumulative_variance=cumulative_variance.tolist(), pcaData = pcaTableData, data_for_plot=data_for_plot)


if __name__ == '__main__':
    app.run(debug=True)
