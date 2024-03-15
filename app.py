from flask import Flask, render_template, jsonify,request
import pandas as pd
import json
from sklearn.cluster import KMeans
import numpy as np
from sklearn.decomposition import PCA
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from logics import generatePCATableData, generateScreePlotData
app = Flask(__name__)

clusters = 4
@app.route('/pca-data/<int:n_components>')
def pca_data(n_components):
    # Ensure n_components is within a valid range to avoid errors
    n_components = max(1, min(n_components, 15))
    pcaTableData = generatePCATableData(n_components)
    return pcaTableData


@app.route('/biplot/<int:n_clusters>')
def biplot(n_clusters=4):  # Default to 4 clusters if not specified
    global clusters
    df = pd.read_csv('Final_dataset.csv')
    scaler = StandardScaler()
    df_scaled = scaler.fit_transform(df.iloc[:, 1:]) 

    pca = PCA(n_components=2) 
    pca_results = pca.fit_transform(df_scaled)

    scores = pd.DataFrame(pca_results, columns=['PC1', 'PC2'])
    loadings = pd.DataFrame(pca.components_.T, columns=['PC1', 'PC2'], index=df.columns[1:])

    # Use the provided number of clusters
    kmeans = KMeans(n_clusters=n_clusters, random_state=0).fit(scores)
    scores['cluster'] = kmeans.labels_
    clusters = n_clusters
    print("Updated CLusters: ", clusters)
    data_for_plot = {
        "scores": scores.to_dict(orient='records'), 
        "loadings": loadings.to_dict(orient='records'), 
        "explained_variance_ratio": pca.explained_variance_ratio_.tolist(),
    }
    return (data_for_plot)


def calculate_wcss(data):
    mse = []
    for i in range(1, 11):
        kmeans = KMeans(n_clusters=i, init='k-means++', max_iter=300, n_init=10, random_state=0)
        clusters = kmeans.fit_predict(data)
        # Calculate MSE for the clustering
        mse.append(mean_squared_error(data, kmeans.cluster_centers_[clusters]))

    # Scaling MSE values between 0 to 100 for better visualization or further processing
    scaler = MinMaxScaler(feature_range=(0, 100))
    mse_scaled = scaler.fit_transform(np.array(mse).reshape(-1, 1)).flatten().tolist()

    return mse_scaled


@app.route('/calculate-mse')
def get_mse():
    # Load your dataset here
    data = pd.read_csv('Final_dataset.csv')  # Replace with your actual CSV path
    data_std = StandardScaler().fit_transform(data)
    mse_scaled = calculate_wcss(data_std)
    return jsonify(mse=mse_scaled)


@app.route('/')
def hello_world():
    variance_explained, cumulative_variance = generateScreePlotData()
    pcaTableData = generatePCATableData(15)
    data_for_plot = biplot()
    # scatter_plot_matrix = setTopAttributes()
    return render_template('index.html', variance_explained=variance_explained.tolist(), cumulative_variance=cumulative_variance.tolist(), pcaData = pcaTableData, data_for_plot=data_for_plot)

#Scatter plot
@app.route('/set-top-attributes', methods=['POST'])
def setTopAttributes():
    request_data = request.get_json()  # Get data sent to this endpoint
    top4_attributes = request_data['top4Attributes']  # Extract top 4 attributes from the sent data
    print(top4_attributes)
    csv_data = pd.read_csv('Final_dataset.csv')
    selected_columns = [col for col in top4_attributes if col in csv_data.columns]
    
    result_df = csv_data[selected_columns]
    kmeans = KMeans(n_clusters=clusters, random_state=0).fit(result_df)
    result_df['cluster'] = kmeans.labels_
    result_json = result_df.to_json(orient='records', indent=2)
    
    return jsonify(result_json)


if __name__ == '__main__':
    app.run(debug=True)
