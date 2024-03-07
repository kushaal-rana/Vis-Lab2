from flask import Flask, render_template
import pandas as pd
import numpy as np
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

def generateScreePlotData():
    data = pd.read_csv('Final_dataset.csv')
    data_std = StandardScaler().fit_transform(data)
    pca = PCA()
    pca.fit(data_std)
    variance_explained = pca.explained_variance_ratio_
    cumulative_variance = np.cumsum(variance_explained)
    print (variance_explained)
    print (cumulative_variance)
    return variance_explained, cumulative_variance


def generatePCATableData(nComponents):
    your_data = pd.read_csv('Final_dataset.csv')
    data_std = StandardScaler().fit_transform(your_data)

    squared_sum_values_list = []
    finalResultData = []

    for components in range(1, nComponents+1):
        result = []
        pca = PCA(n_components=components)
        principal_components = pca.fit_transform(data_std)
        attribute_loadings = pca.components_
        squared_sum_pc = np.round(np.sum(attribute_loadings ** 2, axis=0), 4)
        pc_columns = [f'PC{i + 1}' for i in range(components)]
        pc_df = pd.DataFrame(attribute_loadings.T, columns=pc_columns, index=your_data.columns)
        pc_df['Squared Sum'] = squared_sum_pc
        pc_df_sorted = pc_df.sort_values(by='Squared Sum', ascending=False)


        attributes_list = ['Attribute'] + pc_df_sorted.index.tolist()
        result.append(attributes_list)

        for column in pc_df_sorted.columns:
            pc_values = [column] + [round(value, 4) for value in pc_df_sorted[column].tolist()]
            result.append(pc_values)

        finalResultData.append(result)

    return finalResultData

