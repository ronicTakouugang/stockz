try:
    from transformers import AutoTokenizer, AutoModelForSequenceClassification
    import torch
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False

import requests
import os
from dotenv import load_dotenv
import datetime

load_dotenv()

class SentimentAnalyzer:
    def __init__(self):
        self.enabled = False
        if HAS_TRANSFORMERS:
            try:
                self.tokenizer = AutoTokenizer.from_pretrained("ProsusAI/finbert")
                self.model = AutoModelForSequenceClassification.from_pretrained("ProsusAI/finbert", use_safetensors=True)
                self.enabled = True
            except Exception as e:
                print(f"Sentiment initialization failed: {e}")
        
        self.finnhub_api_key = os.getenv("NEXT_PUBLIC_FINNHUB_API_KEY")

    def get_sentiment(self, symbol):
        if not self.enabled:
            return {"sentiment": "Neutral", "score": 0.0, "count": 0, "status": "Model Offline"}
            
        try:
            end = datetime.date.today().strftime('%Y-%m-%d')
            start = (datetime.date.today() - datetime.timedelta(days=7)).strftime('%Y-%m-%d')
            
            url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={start}&to={end}&token={self.finnhub_api_key}"
            response = requests.get(url)
            
            if response.status_code != 200:
                return {"sentiment": "Neutral", "score": 0.0, "count": 0, "status": "API Error"}
                
            news = response.json()
            if not news:
                return {"sentiment": "Neutral", "score": 0.0, "count": 0, "status": "No News"}
                
            headlines = [item['headline'] for item in news[:10]]
            
            inputs = self.tokenizer(headlines, padding=True, truncation=True, return_tensors="pt")
            with torch.no_grad():
                outputs = self.model(**inputs)
            
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            mean_predictions = predictions.mean(dim=0)
            
            pos = float(mean_predictions[0])
            neg = float(mean_predictions[1])
            neu = float(mean_predictions[2])
            
            sentiment = "Positive" if pos > neg and pos > neu else "Negative" if neg > pos and neg > neu else "Neutral"
            score = pos - neg
            
            return {
                "sentiment": sentiment,
                "score": score,
                "positive": pos,
                "negative": neg,
                "neutral": neu,
                "count": len(headlines)
            }
        except Exception as e:
            return {"sentiment": "Neutral", "score": 0.0, "count": 0, "status": f"Error: {str(e)}"}
