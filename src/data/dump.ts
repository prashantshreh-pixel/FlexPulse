import fs from 'fs';
import { INITIAL_EXERCISES, INITIAL_PROGRAMS } from './initialData';

fs.writeFileSync('seed.json', JSON.stringify({
  exercises: INITIAL_EXERCISES,
  programs: INITIAL_PROGRAMS
}, null, 2));
