import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:5000/api/ai/query'
payload = {'query': 'מי נמצא בחו"ל בתאריך 25.08.26'}
req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode('utf-8'))
    print('TEST QUERY:', payload['query'])
    print('RESULT ANSWER:\n' + res.get('answer', ''))
