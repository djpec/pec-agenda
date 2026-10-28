import {validate} from './model.mjs';
export const FORMAT='agenda-do-artista.financeiro';
export function backup(state){return{format:FORMAT,version:1,exportedAt:new Date().toISOString(),state:validate(structuredClone(state))}}
export function parseBackup(text){
 if(typeof text!=='string'||text.length>10485760)throw Error('Use um backup JSON do financeiro com até 10 MB.');
 try{const data=JSON.parse(text);if(!data||data.format!==undefined&&(data.format!==FORMAT||data.version!==1)||!data.state)throw Error();return validate(data.state)}catch{throw Error('Este arquivo não é um backup válido do financeiro. Nenhum dado foi alterado.')}
}
