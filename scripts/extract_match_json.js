const fs = require('fs');
const path = require('path');

const jsonPath = 'H:/VIBE CODE/ind basketball/data/processed_adv/75TH_SN.json';
const matchId = '2798606';

try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const matchData = data[matchId];
    if (matchData) {
        console.log('Match Data Keys:', Object.keys(matchData));
        fs.writeFileSync('match_2798606.json', JSON.stringify(matchData, null, 2));
        console.log('Saved match_2798606.json');
        
        if (matchData.PlayByPlay) {
            console.log('PlayByPlay found! Length:', matchData.PlayByPlay.length);
            console.log('Sample Play:', JSON.stringify(matchData.PlayByPlay[0], null, 2));
        } else {
            console.log('No PlayByPlay key found in match data.');
        }
    } else {
        console.log('Match not found in JSON.');
    }
} catch (err) {
    console.error(err);
}
