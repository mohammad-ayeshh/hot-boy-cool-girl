// Entry point. The Feel Lab is the default page for now; the old device + network test lives at ?test.
import './ui/style.css';

const params = new URLSearchParams(location.search);
if (params.has('test')) void import('./devtest').then((m) => m.startDeviceTest());
else void import('./lab/feelLab').then((m) => m.startFeelLab());
