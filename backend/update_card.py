import os

path = r'C:\Users\nafta\OneDrive\שולחן העבודה\Pikud360\frontend - NEW\src\components\dashboard\StatsComparisonCard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = '    if (loading) {'
replacement = '    if (loading && (!data || data.length === 0)) {'

if target in text:
    text = text.replace(target, replacement, 1)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('UPDATED StatsComparisonCard SUCCESSFULLY!')
else:
    print('Target not found')
