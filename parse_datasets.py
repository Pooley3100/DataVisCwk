#Goal is to create one csv file.

#Using median salary dataset
#Education level dataset
#And crime rate dataset

#Years 2011 - 2019


import csv
import pandas as pd

input_file = "DATASETS/income-of-tax-payers.csv"
output_file = "parsed_data.csv"

# First clean the income of tax payers file
dict_out = {}
with open(input_file, "r") as csvfile:
    reader = csv.reader(csvfile)
    rows = list(reader)

    for row in rows[3:36]:
        #print(row)
        area_name = row[1] 
        year = 1999
        for i in range(4, len(row),3):
            if area_name == 'Richmond-upon-Thames':
                area_name = 'Richmond upon Thames'
            elif area_name == 'Kingston-upon-Thames':
                area_name = 'Kingston upon Thames'
            if(year >= 2011 and year<=2019 and area_name != 'City of London'):
                dict_out[f'{area_name} {year}'] = {"Median Salary: " : row[i].strip()}
            year+=1

# Second clean the qualifactions file
df = pd.read_excel("DATASETS/Qualifications-by-economic-activity-status-borough.xlsx", sheet_name=None)
print(df['2004'].iloc[2][1])
for i in range(2011, 2020):
    sheet = df[str(i)]
    for j in range(2, 35):
        row = sheet.iloc[j]
        #Index's 1 = Area Name, 4 = NVQ4+%, 16 = NVQ3%, 28 = Trade%, 40 = NVQ2, 52 = NVQ1, 64 = other, 76 = none
        if f'{row[1]} {i}' not in dict_out:
            print(f"Error, adding median salary for {row[1]} {i}")
            continue
        dict_out[f'{row[1]} {i}']['NVQ4'] = row[4]
        dict_out[f'{row[1]} {i}']['NVQ3'] = row[16]
        dict_out[f'{row[1]} {i}']['Trade'] = row[28]
        dict_out[f'{row[1]} {i}']['NVQ2'] = row[40]
        dict_out[f'{row[1]} {i}']['NVQ1'] = row[52]
        dict_out[f'{row[1]} {i}']['other'] = row[64]
        dict_out[f'{row[1]} {i}']['None'] = row[76]

# Finally append the crime rates, need to sum each crime sub group and sum each month to get a result for the years 2011 to 2019
crime_df = pd.read_csv("DATASETS/MPS Borough Level Crime (Historical).csv")

# columns to rows
crime_melted = crime_df.melt(
    id_vars=["MajorText", "MinorText", "BoroughName"],
    var_name="Month", value_name="CrimeCount"
)

# hacky way get year out
crime_melted["Year"] = crime_melted["Month"].str[:4]

crime_melted = crime_melted[crime_melted["Year"].str.isnumeric()]
crime_melted["Year"] = crime_melted["Year"].astype(int)
crime_filtered = crime_melted[(crime_melted["Year"] >= 2011) & (crime_melted["Year"] <= 2019)]

# Group by bourugh and year, then sum
grouped_crime = crime_filtered.groupby(["BoroughName", "Year"])["CrimeCount"].sum().reset_index()

for _, row in grouped_crime.iterrows():
    borough = row["BoroughName"]
    year = row["Year"]
    total = row["CrimeCount"]
    if f'{borough} {year}' not in dict_out:
        print(f"error, adding Crime Rate for {borough} {year}")
        continue
    dict_out[f'{borough} {year}']['Crime Rate'] = total

#print(dict_out)

with open(output_file, "w", newline="") as outfile:
    writer = csv.writer(outfile)
    writer.writerow(["Borough", "Year", "Median Salary","NVQ4+%", "NVQ3%","Trade Apprenticeship","NVQ2%","NVQ1","Other", "None", "Crime Rate"]) 

    for row in dict_out.items():
        area = row[0][:-4].strip()
        year = row[0][-4:]
        obj = row[1]
        obj_str = []
        for stat in obj.values():   
            obj_str.append(str(stat))
        
        writer.writerow([area, year] + obj_str)  