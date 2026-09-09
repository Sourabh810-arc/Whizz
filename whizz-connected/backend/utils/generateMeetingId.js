const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 4);

const generateMeetingId = () => `${nanoid()}-${nanoid()}-${nanoid()}`;

module.exports = generateMeetingId;
