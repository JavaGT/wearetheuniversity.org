---
slug: university-data/reading-lists
title: University Reading List Data
---


## Finding data on course reading lists in Aotearoa programmatically.

### Leganto
Finding leganto subdomains with Google Search
```
inurl:leganto.exlibrisgroup.com PoweredbyLeganto inurl:index.html
```
Bookmarklet to extract all domains from a page's links (Google results) (saved to local storage)
```javascript
javascript:(function(){const domains=new Set(JSON.parse(localStorage.getItem('domains')||'[]'));document.querySelectorAll('a').forEach(a=>{try{const url=new URL(a.href);domains.add(url.hostname)}catch(e){console.error('error parsing url',a.href,e)}});localStorage.setItem('domains',JSON.stringify([...domains]))})()
```

| Subdomain                                                      | University (AI Guess)            | Country (AI Guess) |
| -------------------------------------------------------------- | -------------------------------- | ------------------ |
| [acu](https://acu.leganto.exlibrisgroup.com)                   | Australian Catholic University   | Australia          |
| [adelaide](https://adelaide.leganto.exlibrisgroup.com)         | University of Adelaide           | Australia          |
| [bu](https://bu.leganto.exlibrisgroup.com)                     | ??                               | ??                 |
| [cumbria](https://cumbria.leganto.exlibrisgroup.com)           | University of Cumbria            | UK                 |
| [gslg-lnu](https://gslg-lnu.leganto.exlibrisgroup.com)         | ??                               | ??                 |
| [harper-adams](https://harper-adams.leganto.exlibrisgroup.com) | Harper Adams University          | UK                 |
| [icc-yvc](https://icc-yvc.leganto.exlibrisgroup.com)           | ??                               | ??                 |
| [lincoln](https://lincoln.leganto.exlibrisgroup.com)           | University of Lincoln            | UK                 |
| [liuc](https://liuc.leganto.exlibrisgroup.com)                 | ??                               | Italy              |
| [manchester](https://manchester.leganto.exlibrisgroup.com)     | University of Manchester         | UK                 |
| [northampton](https://northampton.leganto.exlibrisgroup.com)   | University of Northampton        | UK                 |
| [salford](https://salford.leganto.exlibrisgroup.com)           | University of Salford            | UK                 |
| [stir](https://stir.leganto.exlibrisgroup.com)                 | University of Stirling           | UK                 |
| [uclan](https://uclan.leganto.exlibrisgroup.com)               | University of Central Lancashire | UK                 |
| [usc-psb](https://usc-psb.leganto.exlibrisgroup.com)           | ??                               | ??                 |
| [usc](https://usc.leganto.exlibrisgroup.com)                   | University of the Sunshine Coast | Australia          |
| [usq](https://usq.leganto.exlibrisgroup.com)                   | University of Southern Queensland | Australia          |
| [uwa](https://uwa.leganto.exlibrisgroup.com)                   | University of Western Australia  | Australia          |
| [uonda](https://uonda.leganto.exlibrisgroup.com)               | University of North Dakota       | USA                |
| [uow](https://uow.leganto.exlibrisgroup.com)                   | University of Wollongong         | Australia          |
| [uq](https://uq.leganto.exlibrisgroup.com)                     | University of Queensland         | Australia          |
| [usyd](https://usyd.leganto.exlibrisgroup.com)                 | University of Sydney             | Australia          |
| [york](https://york.leganto.exlibrisgroup.com)                 | University of York               | UK                 |

### Talis
Finding talis subdomains with Google Search
```
inurl:rl inurl:talis.com PoweredbyTalisAspire inurl:index.html
```

*Janurary 2024*
| Subdomain                                                | University (AI Guess)                           | Country (AI Guess) |
| -------------------------------------------------------- | ----------------------------------------------- | ------------------ |
| [aber](https://aber.rl.talis.com)                        | Aberystwyth University                          | UK                 |
| [aston](https://aston.rl.talis.com)                      | Aston University                                | UK                 |
| [auckland](https://auckland.rl.talis.com)                | University of Auckland                          | NZ                 |
| [aut](https://aut.rl.talis.com)                          | Auckland University of Technology               | NZ                 |
| [bangor](https://bangor.rl.talis.com)                    | Bangor University                               | UK                 |
| [bathspa](https://bathspa.rl.talis.com)                  | Bath Spa University                             | UK                 |
| [beckett](https://beckett.rl.talis.com)                  | Leeds Beckett University                        | UK                 |
| [bedfordshire](https://bedfordshire.rl.talis.com)        | University of Bedfordshire                      | UK                 |
| [bham](https://bham.rl.talis.com)                        | University of Birmingham                        | UK                 |
| [bimmu](https://bimmu.rl.talis.com)                      | BIMM University                                 | UK                 |
| [binorway](https://binorway.rl.talis.com)                | BI Norwegian Business School                    | Norway             |
| [bishopg](https://bishopg.rl.talis.com)                  | Bishop Grosseteste University                   | UK                 |
| [bolton](https://bolton.rl.talis.com)                    | University of Bolton                            | UK                 |
| [bournemouth](https://bournemouth.rl.talis.com)          | Bournemouth University                          | UK                 |
| [bpp](https://bpp.rl.talis.com)                          | BPP University                                  | UK                 |
| [bradford](https://bradford.rl.talis.com)                | University of Bradford                          | UK                 |
| [brighton](https://brighton.rl.talis.com)                | University of Brighton                          | UK                 |
| [bristol](https://bristol.rl.talis.com)                  | University of Bristol                           | UK                 |
| [broadminster](https://broadminster.rl.talis.com)        | University of Worcester                         | UK                 |
| [brookes](https://brookes.rl.talis.com)                  | Oxford Brookes University                       | UK                 |
| [brunel](https://brunel.rl.talis.com)                    | Brunel University London                        | UK                 |
| [cccu](https://cccu.rl.talis.com)                        | Canterbury Christ Church University             | UK                 |
| [chichester](https://chichester.rl.talis.com)            | University of Chichester                        | UK                 |
| [city](https://city.rl.talis.com)                        | City, University of London                      | UK                 |
| [coventry](https://coventry.rl.talis.com)                | Coventry University                             | UK                 |
| [cranfield](https://cranfield.rl.talis.com)              | Cranfield University                            | UK                 |
| [cst](https://cst.rl.talis.com)                          | University of Central Lancashire                | UK                 |
| [deakin](https://deakin.rl.talis.com)                    | Deakin University                               | Australia          |
| [demoamerica](https://demoamerica.rl.talis.com)          | Demo America                                    | USA                |
| [dmu](https://dmu.rl.talis.com)                          | De Montfort University                          | UK                 |
| [douglascollege](https://douglascollege.rl.ca.talis.com) | Douglas College                                 | Canada             |
| [durham](https://durham.rl.talis.com)                    | Durham University                               | UK                 |
| [edgehill](https://edgehill.rl.talis.com)                | Edge Hill University                            | UK                 |
| [exeter](https://exeter.rl.talis.com)                    | University of Exeter                            | UK                 |
| [essex](https://essex.rl.talis.com)                      | University of Essex                             | UK                 |
| [falmouth](https://falmouth.rl.talis.com)                | Falmouth University                             | UK                 |
| [glasgow](https://glasgow.rl.talis.com)                  | University of Glasgow                           | UK                 |
| [glos](https://glos.rl.talis.com)                        | University of Gloucestershire                   | UK                 |
| [gold](https://gold.rl.talis.com)                        | Goldsmiths, University of London                | UK                 |
| [griffith](https://griffith.rl.talis.com)                | Griffith University                             | Australia          |
| [gsa](https://gsa.rl.talis.com)                          | Glasgow School of Art                           | UK                 |
| [hcicourse](https://hcicourse.rl.talis.com)              | HCI Course                                      | UK                 |
| [herts](https://herts.rl.talis.com)                      | University of Hertfordshire                     | UK                 |
| [info](https://info.rl.talis.com)                        | Info                                            | UK                 |
| [jcu](https://jcu.rl.talis.com)                          | James Cook University                           | Australia          |
| [keele](https://keele.rl.talis.com)                      | Keele University                                | UK                 |
| [kent](https://kent.rl.talis.com)                        | University of Kent                              | UK                 |
| [kmms](https://kmms.rl.talis.com)                        | King's College London                           | UK                 |
| [langara](https://langara.rl.ca.talis.com)               | Langara College                                 | Canada             |
| [latrobe](https://latrobe.rl.talis.com)                  | La Trobe University                             | Australia          |
| [lboro](https://lboro.rl.talis.com)                      | Loughborough University                         | UK                 |
| [leicester](https://leicester.rl.talis.com)              | University of Leicester                         | UK                 |
| [lincoln](https://lincoln.rl.talis.com)                  | University of Lincoln                           | UK                 |
| [liverpool](https://liverpool.rl.talis.com)              | Liverpool John Moores University                | UK                 |
| [ltu](https://ltu.rl.talis.com)                          | Leeds Trinity University                        | UK                 |
| [macewan](https://macewan.rl.ca.talis.com)               | MacEwan University                              | Canada             |
| [medway](https://medway.rl.talis.com)                    | University of Greenwich                         | UK                 |
| [murdoch](https://murdoch.rl.talis.com)                  | Murdoch University                              | Australia          |
| [northumbria](https://northumbria.rl.talis.com)          | Northumbria University                          | UK                 |
| [notts](https://notts.rl.talis.com)                      | University of Nottingham                        | UK                 |
| [nuigalway](https://nuigalway.rl.talis.com)              | National University of Ireland, Galway          | Ireland            |
| [okanagan](https://okanagan.rl.ca.talis.com)             | University of British Columbia                  | Canada             |
| [ozdemo](https://ozdemo.rl.talis.com)                    | Oz Demo                                         | Australia          |
| [port](https://port.rl.talis.com)                        | University of Portsmouth                        | UK                 |
| [preview](https://preview.rl.talis.com)                  | Preview                                         | UK                 |
| [qmul](https://qmul.rl.talis.com)                        | Queen Mary University of London                 | UK                 |
| [qut](https://qut.rl.talis.com)                          | Queensland University of Technology             | Australia          |
| [rau](https://rau.rl.talis.com)                          | Royal Agricultural University                   | UK                 |
| [rave](https://rave.rl.talis.com)                        | Ravensbourne University London                  | UK                 |
| [reading](https://reading.rl.talis.com)                  | University of Reading                           | UK                 |
| [regents](https://regents.rl.talis.com)                  | Regent's University London                      | UK                 |
| [rhul](https://rhul.rl.talis.com)                        | Royal Holloway, University of London            | UK                 |
| [roehampton](https://roehampton.rl.talis.com)            | University of Roehampton                        | UK                 |
| [scu](https://scu.rl.talis.com)                          | Southern Cross University                       | Australia          |
| [shu](https://shu.rl.talis.com)                          | Sheffield Hallam University                     | UK                 |
| [solent](https://solent.rl.talis.com)                    | Solent University                               | UK                 |
| [soton](https://soton.rl.talis.com)                      | University of Southampton                       | UK                 |
| [southwalesruc](https://southwales.rl.talis.com)         | University of South Wales                       | UK                 |
| [sta](https://sta.rl.talis.com)                          | St. Andrews University                          | UK                 |
| [tcdlibrary](https://tcdlibrary.rl.talis.com)            | Trinity College Dublin                          | Ireland            |
| [technicalone](https://technicalone.rl.talis.com)        | Technical One                                   | UK                 |
| [technicaltwo](https://technicaltwo.rl.talis.com)        | Technical Two                                   | UK                 |
| [teesside](https://teesside.rl.talis.com)                | Teesside University                             | UK                 |
| [testone](https://testone.rl.talis.com)                  | Test One                                        | UK                 |
| [trial](https://trial.rl.talis.com)                      | Trial                                           | UK                 |
| [tudelft](https://tudelft.rl.talis.com)                  | Delft University of Technology                  | Netherlands        |
| [ualberta](https://ualberta.rl.ca.talis.com)             | University of Alberta                           | Canada             |
| [uca](https://uca.rl.talis.com)                          | University for the Creative Arts                | UK                 |
| [ucb](https://ucb.rl.talis.com)                          | University College Birmingham                   | UK                 |
| [ucl](https://ucl.rl.talis.com)                          | University College London                       | UK                 |
| [uea](https://uea.rl.talis.com)                          | University of East Anglia                       | UK                 |
| [uhi](https://uhi.rl.talis.com)                          | University of the Highlands and Islands         | UK                 |
| [uky](https://uky.rl.talis.com)                          | University of Kentucky                          | USA                |
| [unmc](https://unmc.rl.talis.com)                        | University of Nebraska Medical Center           | USA                |
| [unnc](https://unnc.rl.talis.com)                        | University of Nottingham                        | UK                 |
| [unthsc](https://unthsc.rl.talis.com)                    | University of North Texas Health Science Center | USA                |
| [uq](https://uq.rl.talis.com)                            | University of Queensland                        | Australia          |
| [utas](https://utas.rl.talis.com)                        | University of Tasmania                          | Australia          |
| [uwe](https://uwe.rl.talis.com)                          | University of the West of England               | UK                 |
| [uwl](https://uwl.rl.talis.com)                          | University of West London                       | UK                 |
| [victoria](https://victoria.rl.talis.com)                | Victoria University of Wellington               | NZ                 |
| [vu](https://vu.rl.talis.com)                            | Vrije Universiteit Amsterdam                    | Netherlands        |
| [waikato](https://waikato.rl.talis.com)                  | University of Waikato                           | NZ                 |
| [warwick](https://warwick.rl.talis.com)                  | University of Warwick                           | UK                 |
| [worc](https://worc.rl.talis.com)                        | University of Worcester                         | UK                 |
| [yorksj](https://yorksj.rl.talis.com)                    | York St John University                         | UK                 |