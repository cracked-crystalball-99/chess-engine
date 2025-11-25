import yfinance as yf
import pandas as pd

# Download 6 months of daily data for HLS.AX
symbol = "HLS.AX"
hist = yf.download(symbol, period="6mo")

# Reset index to get 'Date' as a column
hist = hist.reset_index()


# Handle multi-level columns (if present)
if isinstance(hist.columns, pd.MultiIndex):
	# Flatten columns: ('Open', 'HLS.AX') -> 'Open'
	hist.columns = [col[0] if col[0] else col[1] for col in hist.columns.values]


# Reformat date to match sample (D/M/YYYY, no leading zeros, no time)
def format_date(dt):
	dt = pd.to_datetime(dt)
	return f"{dt.day}/{dt.month}/{dt.year}  "
hist['Date'] = hist['Date'].apply(format_date)

# Print columns for debugging
print("Columns in downloaded data:", hist.columns.tolist())

# Required columns in order
required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']


# If 'Adj Close' is missing, fill it with 'Close'
if 'Adj Close' not in hist.columns and 'Close' in hist.columns:
	hist['Adj Close'] = hist['Close']

# Only fill with zeros if column is truly missing after flattening
for col in required_cols:
	if col not in hist.columns:
		print(f"Column '{col}' missing, filling with default value.")
		if col == 'Date':
			hist[col] = ''
		elif col == 'Volume':
			hist[col] = 0
		else:
			hist[col] = 0.0

# Reorder columns
hist = hist[required_cols]

# Save to CSV with matching formatting (spaces after commas for alignment)
with open("hls_ax_6mo_close.csv", "w") as f:
	# Write header
	f.write(",".join(hist.columns) + "\n")
	for _, row in hist.iterrows():
		# Format each value with padding to match GME.csv style
		line = f"{row['Date']},{row['Open']:<9},{row['High']:<9},{row['Low']:<9},{row['Close']:<9},{row['Adj Close']:<9},{int(row['Volume']):>9}\n"
		f.write(line)
print("Saved as hls_ax_6mo_close.csv in GME.csv format (all 7 columns, correct order, date and spacing fixed).")
