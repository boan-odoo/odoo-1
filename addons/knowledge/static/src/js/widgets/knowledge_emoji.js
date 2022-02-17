/** @odoo-module **/

const FaceEmojiSection = {
    id: 'face',
    title: 'Faces',
    icon: '😊',
    emojis: [
        ['😊', [':)']],
        ['😂', ['x\'D']],
        ['😊', [':)']]
    ],
};

const FoodEmojiSection = {
    id: 'food',
    title: 'Food',
    icon: '🍪',
    emojis: [
        ['🍪', [':cookie']],
        ['🍕', [':pizza']],
        ['🍔', [':hamburger']]
    ]
};

const sections = [
    FaceEmojiSection,
    FoodEmojiSection
];

for (const section of sections) {
    section.emojis = _.map(section.emojis, entry => {
        return {
            unicode: entry[0],
            description: entry[1]
        };
    });
}

export default sections;