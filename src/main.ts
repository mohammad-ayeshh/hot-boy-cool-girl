// Entry point: the online game by default, the Feel Lab at ?lab, the device + network test at ?test.
import './ui/style.css';

const params = new URLSearchParams(location.search);
if (params.has('test')) void import('./devtest').then((m) => m.startDeviceTest());
else if (params.has('lab')) void import('./lab/feelLab').then((m) => m.startFeelLab());
else void import('./online/game').then((m) => m.startGame());
