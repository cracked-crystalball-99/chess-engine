import yfinance as yf
import json
from flask import make_response

def fetch_yahoo_finance_data(request):
    """
    HTTP Cloud Function to fetch Yahoo Finance data.

    Args:
        request (flask.Request): The request object.

    Returns:
        The response text, or any set of values that can be turned into a Response object using `make_response`.
    """
    # Parse the request JSON and arguments
    request_json = request.get_json(silent=True)
    request_args = request.args

    # Determine the ticker symbol from the request
    if request_json and 'ticker' in request_json:
        ticker = request_json['ticker']
    elif request_args and 'ticker' in request_args:
        ticker = request_args['ticker']
    else:
        return make_response('No ticker symbol provided', 400)  # Bad Request

    try:
    # Fetch data from Yahoo Finance
    start_date = request_args.get('start')
    end_date = request_args.get('end')

    # Validate start and end dates
    if not start_date or not end_date:
        return make_response('Start and end dates are required', 400)  # Bad Request

    data = yf.download(ticker, start=start_date, end=end_date)

    if data.empty:
        return make_response(f"No data found for ticker: {ticker}", 404)  # Not Found

    # Convert data to JSON format
    data_json = data.to_json(orient='records')

    # Return the JSON response
    return make_response(data_json, 200, {'Content-Type': 'application/json'})  # OK

except Exception as e:
    # Handle any errors that occur during data fetching
    return make_response(f"Error fetching data: {str(e)}", 500)  # Internal Server Error