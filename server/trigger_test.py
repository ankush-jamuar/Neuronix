import requests

def test_ask():
    url = "http://localhost:5005/api/ai/ask"
    payload = {"question": "How does pgvector work?"}
    try:
        # We expect a 401 because no token, but it should hit the controller
        # and log the attempt if the server is reachable.
        print(f"Triggering request to {url}...")
        resp = requests.post(url, json=payload, timeout=5)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ask()
