import {countOfObject, hexToRgbA, jsonParse, sumOfObject} from 'root/lib/func';
import {asMap, asNumber} from 'root/lib/type_utils';
import {color, manafont, typecolorletter} from 'root/lib/utils';
import {currentMatch, overlayConfig, superclasses, userCollection} from 'root/windows/overlay/overlay';

export function makeCard(cid: number, num: number, side: boolean, draft?: boolean): string {
  if (!overlayConfig.metaData) {
    return '';
  }
  const cardsdb = overlayConfig.metaData.allcards;
  const inCollection = userCollection.get(cid);
  const name = cardsdb[cid]['name'];
  const mtgaId = cardsdb[cid]['mtga_id'];
  const mana = cardsdb[cid]['mana'];
  const colorarr = cardsdb[cid]['colorarr'];
  const island = cardsdb[cid]['is_land'];
  const supercls = cardsdb[cid]['supercls'];
  const thumb = cardsdb[cid]['art'];
  const drafteval2 = cardsdb[cid]['drafteval2'];
  const wlevalDraft = cardsdb[cid]['wleval_draft'];
  //const battleusageDraft = cardsdb[cid]['battleusage_draft'];
  let bgcolor = 'linear-gradient(to bottom,';
  let clnum = 0;
  let lastcolor = '';
  const manajMap = asMap(colorarr !== '' && colorarr !== '[]' ? jsonParse(colorarr) : jsonParse(mana));
  const manaj: {[index: string]: number} = {};

  if (manajMap !== undefined) {
    Object.keys(manajMap).forEach(elem => {
      manaj[elem] = asNumber(manajMap[elem], 0);
    });
  }

  if (side) {
    currentMatch.totalCards += num;
    if (!currentMatch.cardsBySuperclass.has(supercls.toString())) {
      currentMatch.cardsBySuperclass.set(supercls.toString(), num);
    } else {
      const n = currentMatch.cardsBySuperclass.get(supercls.toString()) as number;
      currentMatch.cardsBySuperclass.set(supercls.toString(), n + num);
    }
    if (island === 1) {
      Object.keys(manaj).forEach(landClr => {
        if (!currentMatch.lands.has(landClr)) {
          currentMatch.lands.set(landClr, num);
        } else {
          const n = currentMatch.lands.get(landClr) as number;
          currentMatch.lands.set(landClr, n + num);
        }
      });
    }
  }

  let manas = '';

  const allcol = countOfObject(manaj);
  if (allcol > 0) {
    Object.keys(manaj).forEach((clr: string) => {
      if (clr !== 'Colorless' || +allcol === 0) {
        if (clr.indexOf('/') === -1) {
          if (manafont[clr.toLowerCase()] !== '') {
            bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter[clr]}`);
            lastcolor = hexToRgbA(`#${typecolorletter[clr]}`);
            clnum++;
          } else {
            const splitclrs: string[] = clr.split('/');
            splitclrs.forEach(cl => {
              bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter[cl]}`);
              lastcolor = hexToRgbA(`#${typecolorletter[cl]}`);
              clnum++;
            });
          }
        }
      } else if (clr === 'Colorless' && +sumOfObject(manaj) === +manaj['Colorless']) {
        bgcolor += `${hexToRgbA('#ababab')},${hexToRgbA('#ababab')}`;
      }
    });

    if (clnum === 1) {
      bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + lastcolor;
    }
  } else {
    bgcolor += (bgcolor !== 'linear-gradient(to bottom,' ? ',' : '') + hexToRgbA(`#${typecolorletter.Colorless}`);
    lastcolor = hexToRgbA(`#${typecolorletter.Colorless}`);
    clnum++;
  }
  bgcolor += ') 1 100%';

  color.forEach(clr => {
    // tslint:disable-next-line: strict-boolean-expressions
    if (manaj && manaj[clr] > 0 && +island === 0) {
      if (clr !== 'Colorless') {
        for (let i = 0; i < manaj[clr]; i++) {
          manas += `
                <span class="ManaGroup ms ms-${manafont[clr.toLowerCase()]}"
                ></span>`;
        }
      } else {
        manas += `<span class="ManaGroup ms ms-${manaj[clr]}"></span>`;
      }
    }
  });

  let draftOut = '';

  if (draft) {
    const digits: ('leftdraftdigit' | 'rightdraftdigit')[] = ['leftdraftdigit', 'rightdraftdigit'];
    const digitsFilled: Map<string, string> = new Map();
    digits.forEach(digit => {
      if (!overlayConfig.ovlSettings) {
        return;
      }
      switch (overlayConfig.ovlSettings[digit]) {
        case 1:
          digitsFilled.set(digit, (100 * drafteval2).toFixed(1));
          break;
        case 2:
          digitsFilled.set(digit, (100 * wlevalDraft).toFixed(1));
          break;
        case 3:
          digitsFilled.set(digit, inCollection !== undefined ? inCollection.toString() : '0');
          break;
        case 4:
          digitsFilled.set(digit, '');
          break;
      }
    });

    draftOut = `<div class="uppernum">${
      digitsFilled.get('leftdraftdigit') !== undefined
        ? `<div class="leftuppernum">${digitsFilled.get('leftdraftdigit')}</div>`
        : ''
    } ${digitsFilled.get('rightdraftdigit') !== undefined ? digitsFilled.get('rightdraftdigit') : ''}</div>`;
  }

  return `
  <div class="DcDrow" data-cid="${cid}" data-side="${side ? 'me' : 'opp'}" id="card${mtgaId}${side ? 'me' : 'opp'}">
  <div class="CardSmallPic${!overlayConfig.ovlSettings?.showcardicon ? ' picWithNoPic' : ''}" id="cardthumb${mtgaId}${
    side ? 'me' : 'opp'
  }" style="background:url('https://mtgarena.pro/mtg/pict/thumb/${thumb}') 50% 50%; border-image:${bgcolor}">
  </div>
  <div class="CNameManaWrap">
  <div class="CCmana">
  ${manas} ${manas !== '' ? '|' : ''} <span class="ms ms-${superclasses[cardsdb[cid]['supercls']]}">
  </div>
  <div class="CName">${name}</div>
  </div>
  <div class="Copies" id="cardnum${mtgaId}${side ? 'me' : 'opp'}">
  ${draft ? draftOut : num}</div>
  </div>`;
}
