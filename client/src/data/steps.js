export const VATERUNSER = `Vater unser im Himmel.
Geheiligt werde dein Name.
Dein Reich komme.
Dein Wille geschehe, wie im Himmel, so auf Erden.
Unser tägliches Brot gib uns heute.
Und vergib uns unsere Schuld,
wie auch wir vergeben unsern Schuldigern.
Und führe uns nicht in Versuchung,
sondern erlöse uns von dem Bösen.
Denn dein ist das Reich und die Kraft
und die Herrlichkeit in Ewigkeit. Amen.`;

export const SEGEN = `Der Herr segne dich und behüte dich.
Der Herr lasse sein Angesicht leuchten über dir und sei dir gnädig.
Der Herr hebe sein Angesicht über dich und gebe dir Frieden.`;

export function buildSteps(mode, silenceSeconds = 180) {
  if (mode === 'morgen') {
    return [
      { id: 'ankommen', kind: 'text', duration: 30, text: 'Komm zur Ruhe an. Ein Atemzug.' },
      { id: 'wort', kind: 'verse', duration: 30, verseType: 'losung-morgen' },
      { id: 'stille', kind: 'silence', duration: silenceSeconds, label: 'Stille' },
      { id: 'ausrichtung', kind: 'text', duration: 30, text: 'Was liegt heute vor dir? Halte es ins Licht.' },
      { id: 'vaterunser', kind: 'prayer', duration: 30, label: 'Vaterunser', text: VATERUNSER },
    ];
  }

  if (mode === 'abend') {
    return [
      { id: 'ankommen', kind: 'text', duration: 30, text: 'Komm zur Ruhe an. Ein Atemzug.' },
      { id: 'wort', kind: 'verse', duration: 30, verseType: 'losung' },
      { id: 'stille', kind: 'silence', duration: silenceSeconds, label: 'Stille' },
      { id: 'rueckblick', kind: 'text', duration: 30, text: 'Wofür dankst du? Was gibst du ab?' },
      {
        id: 'segen',
        kind: 'prayer',
        duration: 30,
        label: 'Vaterunser & Segen',
        text: `${VATERUNSER}\n\n${SEGEN}`,
      },
    ];
  }

  return [
    { id: 'ankommen', kind: 'text', duration: 30, text: 'Komm zur Ruhe an. Ein Atemzug.' },
    { id: 'wort', kind: 'verse', duration: 30, verseType: 'taize' },
    { id: 'stille', kind: 'silence', duration: silenceSeconds, label: 'Stille' },
    { id: 'fuerbitte', kind: 'text', duration: 30, text: 'Ein Gedanke, den du Gott hinhältst.' },
    { id: 'vaterunser', kind: 'prayer', duration: 30, label: 'Vaterunser', text: VATERUNSER },
  ];
}
