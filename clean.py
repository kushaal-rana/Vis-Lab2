import pandas as pd
# Assuming your original dataset is stored in a CSV file named 'original_dataset.csv'
original_dataset_path = 'Billionaires_final_dataset.csv'

# Load the dataset into a pandas DataFrame
df = pd.read_csv(original_dataset_path)

# Drop rows with null values in any column
df_cleaned = df.dropna()
print (len(df_cleaned))
# Check if there are 600 or more rows without null values
if len(df_cleaned) >= 600:
    # Randomly select 600 rows
    df_selected = df_cleaned.sample(n=600, random_state=42)  # You can change the random_state for different random selections

    # Save the selected data to a new CSV file
    selected_dataset_path = 'C:/SBU/VIS/Lab1/testing/sav/new.csv'
    df_selected.to_csv(selected_dataset_path, index=False)

    print(f"Successfully selected and saved 600 rows without null values to {selected_dataset_path}")
else:
    print("There are not enough rows without null values to select 600.")