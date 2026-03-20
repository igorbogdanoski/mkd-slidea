const terms = ['балкон'];
const cy = '\u0430-\u0448\u0453\u0455\u0458\u0459\u045a\u045c\u045f\u0410-\u0428\u0403\u0405\u0408\u0409\u040a\u040c\u040f';
const regex = new RegExp('(' + terms.join('|') + ')[' + cy + ']*', 'gi');
const text = 'на балконот';
const matches = [...text.matchAll(regex)];
console.log(matches.map(m => [m[0], m[1]]));