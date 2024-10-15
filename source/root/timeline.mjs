
function event(kind, start, end, title, tags, note, type) {
    return { kind, start, end, title, tags, type, note }
}
function newViceChancellor(university, start, end, name, note) {
    return event(`${university}-vice-chancellor`, start, end, name, ['governance'], note, 'background')
}
function studentProtest(university, date, name, note) {
    return event(`${university}-student-protest`, date, null, name, ['protest'], note, 'box')
}
const data = [
    newViceChancellor('UOA', '2020', Date().split(' ')[3], 'Dawn Freshwater'),
    newViceChancellor('UOA', '2005', '2020', 'Stuart McCutcheon'),
    newViceChancellor('UOA', '1998', '2005', 'John Hood'),
    newViceChancellor('UOA', '1995', '1998', 'Kit Carson'),
    newViceChancellor('UOA', '1971', '1995', 'Sir Colin Maiden'),
    newViceChancellor('UOA', '1958', '1971', 'Kenneth John Maidment', 'Establishment of Vice-Chancellor role'),
    newViceChancellor('UOA', '1949', '1958', 'Kenneth John Maidment', 'Position of Principal'),
    newViceChancellor('UOA', '1949', '1958', 'Kenneth John Maidment', 'Position of Principal'),
    studentProtest('UOA', '2024-08-22', 'Student Led Forum', 'on Course Cuts and Transparency'),
]

let eventKinds = data.reduce((acc, event) => {
    if (!acc[event.kind]) {
        acc[event.kind] = []
    }
    acc[event.kind].push(event)
    return acc
}, {})

let groups = new vis.DataSet()
Object.keys(eventKinds).forEach((kind, index) => {
    groups.add({ id: index, content: kind })
})var items = new vis.DataSet();
for (var i = 0; i < data.length; i++) {
    var dataItem = data[i];
    console.log(dataItem)
    items.add({
        id: i,
        group: Object.keys(eventKinds).indexOf(dataItem.kind),
        content: `${dataItem.title}<br><small>${dataItem.note ? dataItem.note : ''}</small>`,
        start: Date.parse(dataItem.start),
        end: Date.parse(dataItem.end) + 1000 * 60 * 60 * 24 * 100,
        type: dataItem.type ? dataItem.type : 'box'
    });
}

// create visualization
var container = document.getElementById('visualization');
var options = {
    groupOrder: 'content'  // groupOrder can be a property name or a sorting function
};

var timeline = new vis.Timeline(container);
timeline.setOptions(options);
timeline.setGroups(groups);
timeline.setItems(items);
