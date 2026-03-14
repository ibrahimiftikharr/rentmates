import pandas as pd
import numpy as np

df = pd.read_csv('rental_scam_model.csv', encoding='latin1')

# Rename  
df = df.rename(columns={
    'price': 'price',
    'deposit_amount': 'depositAmount',
    'area_average_rent': 'areaAverageRent',
    'is_scam': 'isScam'
})

df['price'] = pd.to_numeric(df['price'], errors='coerce')
df['depositAmount'] = pd.to_numeric(df['depositAmount'], errors='coerce')
df['areaAverageRent'] = pd.to_numeric(df['areaAverageRent'], errors='coerce')

df['priceRatio'] = df['price'] / (df['areaAverageRent'] + 1)
df['depositRatio'] = df['depositAmount'] / (df['price'] + 1)

print('Dataset Statistics:')
print(f'\nPrice Ratio (Legitimate): Min={df[df["isScam"]==0]["priceRatio"].min():.3f}, Max={df[df["isScam"]==0]["priceRatio"].max():.3f}, Mean={df[df["isScam"]==0]["priceRatio"].mean():.3f}')
print(f'Price Ratio (Scam):       Min={df[df["isScam"]==1]["priceRatio"].min():.3f}, Max={df[df["isScam"]==1]["priceRatio"].max():.3f}, Mean={df[df["isScam"]==1]["priceRatio"].mean():.3f}')
print(f'\nDeposit Ratio (Legitimate): Min={df[df["isScam"]==0]["depositRatio"].min():.3f}, Max={df[df["isScam"]==0]["depositRatio"].max():.3f}, Mean={df[df["isScam"]==0]["depositRatio"].mean():.3f}')
print(f'Deposit Ratio (Scam):       Min={df[df["isScam"]==1]["depositRatio"].min():.3f}, Max={df[df["isScam"]==1]["depositRatio"].max():.3f}, Mean={df[df["isScam"]==1]["depositRatio"].mean():.3f}')
