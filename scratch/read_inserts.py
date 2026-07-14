with open('c:/Users/nafta/OneDrive/שולחן העבודה/Pikud360/frontend/src/pages/WorkforceScheduling.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, line in enumerate(lines, 1):
    if 'history' in line.lower() or 'button' in line.lower() or 'link' in line.lower() or 'navigate(' in line.lower():
        if 'lucide' not in line:
            print(f"Line {i}: {line.strip()}")
