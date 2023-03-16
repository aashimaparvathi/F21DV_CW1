import pandas as pd
import numpy as np

pd.set_option('display.min_rows', 100)

covidseries = pd.read_csv('owid-covid-data.csv', header=0, parse_dates=['date'], dayfirst=True, keep_default_na=False, na_values="")
print("Original data")
mask = covidseries.location.str.startswith('Namibia') | covidseries.location.str.startswith('China')
print(covidseries[mask])


df = pd.DataFrame(covidseries)

#mask = df.location.str.startswith('Namibia')
#print(df[mask])

df.drop(['new_cases_smoothed', 'new_deaths_smoothed', 'new_cases_smoothed_per_million', 'new_deaths_smoothed_per_million', 'reproduction_rate', 'icu_patients', 'icu_patients_per_million', 'hosp_patients', 'hosp_patients_per_million', 'weekly_icu_admissions', 'weekly_icu_admissions_per_million', 'weekly_hosp_admissions', 'weekly_hosp_admissions_per_million', 'new_tests_smoothed', 'new_tests_smoothed_per_thousand', 'new_vaccinations_smoothed', 'new_vaccinations_smoothed_per_million', 'new_people_vaccinated_smoothed', 'new_people_vaccinated_smoothed_per_hundred', 'cardiovasc_death_rate', 'diabetes_prevalence', 'handwashing_facilities', 'hospital_beds_per_thousand', 'tests_units', 'excess_mortality_cumulative_absolute', 'excess_mortality_cumulative', 'excess_mortality', 'excess_mortality_cumulative_per_million'], axis=1, inplace=True)

print(df.head())

df = df[df["iso_code"].str.contains("OWID_") == False]

print("Data Frame")
print(df)

#mask = df.location.str.startswith('Namibia')
#print(df[mask])

df.to_csv('covidmain.csv', index=False)

saved_data = df

df['date'] = pd.to_datetime(df['date'], dayfirst=True)

df = df.groupby(['iso_code', 'continent', 'location', pd.Grouper(key='date', freq='M')]).agg({'new_cases': 'sum', 'total_cases': 'mean',  'total_deaths': 'mean', 'total_vaccinations': 'mean', 'population': 'mean'}).reset_index()

print("monthly sample")
print(df)

df['month'] = df['date'].dt.month
#print(df[['location', 'date', 'month', 'total_vaccinations']])
df['year'] = df['date'].dt.year
#print(df[['location', 'date', 'month', 'year', 'total_vaccinations']])

df['vacc_rate'] = (df['total_vaccinations'] / df['population']) * 100;

df.to_csv('monthly.csv', index=False);

df = saved_data.groupby(['iso_code', 'continent', 'location', pd.Grouper(key='date', freq='M')]).agg({'total_cases': 'mean', 'new_cases': 'sum', 'total_deaths': 'mean', 'new_deaths': 'sum', 'total_cases_per_million': 'mean', 'new_cases_per_million': 'sum', 'total_deaths_per_million': 'mean', 'new_deaths_per_million': 'sum', 'total_tests': 'mean', 'new_tests':'sum', 'total_tests_per_thousand': 'mean', 'new_tests_per_thousand': 'sum', 'positive_rate': 'mean', 'tests_per_case': 'mean', 'total_vaccinations': 'mean', 'people_vaccinated': 'mean', 'people_fully_vaccinated': 'mean', 'total_boosters': 'mean', 'new_vaccinations': 'sum', 'total_vaccinations_per_hundred': 'mean', 'people_vaccinated_per_hundred': 'mean', 'people_fully_vaccinated_per_hundred': 'mean', 'total_boosters_per_hundred': 'mean', 'stringency_index': 'mean', 'population_density': 'mean', 'median_age': 'mean', 'aged_65_older': 'mean', 'aged_70_older': 'mean', 'gdp_per_capita': 'mean', 'extreme_poverty': 'mean', 'life_expectancy': 'mean', 'human_development_index': 'mean', 'population': 'mean'}).reset_index()

df['month'] = df['date'].dt.month
#print(df[['location', 'date', 'month', 'total_vaccinations']])
df['year'] = df['date'].dt.year
#print(df[['location', 'date', 'month', 'year', 'total_vaccinations']])

df['vacc_rate'] = (df['total_vaccinations'] / df['population']) * 100;

per_continent = df.groupby(['continent', pd.Grouper(key='date', freq='M')]).agg({'total_cases': 'sum', 'new_cases': 'sum', 'total_deaths': 'sum', 'new_deaths': 'sum', 'total_vaccinations': 'sum', 'people_vaccinated': 'sum', 'people_fully_vaccinated': 'sum', 'total_boosters': 'sum', 'new_vaccinations': 'sum', 'stringency_index': 'mean', 'population_density': 'mean', 'median_age': 'mean', 'gdp_per_capita': 'mean', 'population': 'sum'}).reset_index()

per_continent['month'] = per_continent['date'].dt.month
per_continent['year'] = per_continent['date'].dt.year

print(df[['location', 'date', 'total_vaccinations', 'population', 'vacc_rate']])
df.to_csv('monthly_all.csv', index=False);
per_continent.to_csv('montly_per_continent.csv', index=False);
