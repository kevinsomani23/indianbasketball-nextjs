// Mapping of specific match IDs to their position in the knockout bracket
export const TOURNAMENT_BRACKETS = {
    // Men's Tournament (ID: 1)
    "Men's": {
        quarterFinals: [
            2218276, // QF 1
            2218277, // QF 2
            2218278, // QF 3
            2218279, // QF 4
            2218280, // QF 5 (classification/lower bracket if applicable)
            2218281, // QF 6
            2218282, // QF 7
            2218283  // QF 8
        ].slice(0, 4), // Assuming top 4 logical QFs lead to Semis
        semiFinals: [
            2218816, // Semi 1
            2218817  // Semi 2
        ],
        finals: [
            2219021  // Final
        ]
    },
    // Women's Tournament (ID: 2)
    "Women's": {
        quarterFinals: [
            2218267, // QF 1
            2218268, // QF 2
            2218269, // QF 3
            2218270, // QF 4
            2218271,
            2218273
        ].slice(0, 4), // Take top 4 for main bracket
        semiFinals: [
            2218820, // Semi 1
            2218822  // Semi 2
        ],
        finals: [
            2219200  // Final
        ]
    }
};
