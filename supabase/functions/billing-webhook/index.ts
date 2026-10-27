import {createBackend} from '../_shared/backend.mjs';
Deno.serve(createBackend(name=>Deno.env.get(name)).webhook);
