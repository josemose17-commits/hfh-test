// Euophrys' Uma Musume support card tier list, bundled by tools/build_euophrys.mjs. Do not edit.
// Source: https://github.com/Euophrys/umamusume-tierlist
/*
MIT License

Copyright (c) 2021 Amber Flina

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function (root) {
const events = {
  10021: [25, 10, 5, 5, 15, 70, 160, 10],
  10022: [10, 10, 20, 10, 20, 240, 65, 10],
  10060: [10, 95, 5, 55, 0, 20, 125, 17],
  10074: [30, 30, 30, 30, 30, 65, 110, 0],
  10083: [47, 0, 0, 77, 0, 30, 185, 15],
  10094: [0, 0, 20, 110, 0, 35, 155, 15],

  20001: [0, 0, 0, 0, 20, 15, 0, 0],
  20002: [0, 0, 0, 0, 15, 0, 15, 5],
  20003: [15, 0, 5, 0, 0, 0, 0, 5],
  20004: [0, 5, 10, 15, 0, 0, -10, 0],
  20005: [5, 0, 20, 0, 0, 0, 0, 0],
  20006: [0, 5, 30, 0, 0, 0, -20, 0],
  20007: [0, 10, 0, 0, 0, 45, 0, 5],
  20008: [0, 15, 0, 0, 0, 15, 15, 0],
  20009: [0, 0, 5, 15, 0, 15, -10, 5],
  20010: [0, 0, 20, 0, 0, 15, 0, 5],
  20011: [0, 0, 5, 0, 25, 0, 0, 5],
  20012: [0, 0, 0, 0, 15, 30, 0, 0],
  20013: [0, 0, 0, 0, 0, 0, 30, 0],
  20014: [10, 10, 5, 0, 0, 0, 0, 0],
  20015: [0, 0, 0, 20, 20, 0, 0, 0],
  20016: [0, 0, 0, 0, 0, 60, 5, 5],
  20017: [0, 0, 0, 5, 0, 15, 20, 5],
  20018: [0, 15, 0, 5, 0, 0, 30, 0],
  20019: [0, 10, 0, 15, 0, 0, 0, 0],
  20020: [25, 0, 0, 0, 0, 15, 0, 0],
  20021: [10, 10, 20, 10, 20, 240, 65, 10],
  20022: [10, 5, 0, 0, 0, 10, 10, 5],
  20023: [15, 0, 0, 0, 0, 30, 0, 5],
  20024: [0, 0, 10, 0, 0, 0, 20, 5],
  20025: [0, 0, 0, 0, 25, 20, 0, 0],
  20026: [0, 0, 0, 0, 8, 0, 15, 20],
  20027: [3, 0, 8, 0, 3, 0, 0, 0],
  20028: [0, 15, 0, 0, 15, 0, 0, 5],
  20029: [0, 0, 5, 5, 0, 0, 30, 0],
  20030: [10, 0, 0, 0, 0, 0, 10, 5],

  20031: [20, 0, 0, 0, 0, 15, 0, 5],
  20032: [22, 0, 12, 0, 0, 0, -15, 5],
  20033: [20, 0, 20, 0, 0, 0, 0, 5],
  20034: [5, 0, 0, 0, 5, 10, 40, 0],
  20035: [0, 0, 0, 0, 0, 40, 10, 5],

  20037: [0, 0, 5, 0, 0, 30, 15, 0],
  20038: [15, 0, 15, 15, 0, 0, 0, 5],
  20039: [30, 0, 0, 0, 0, 15, 0, 5],

  20040: [0, 10, 0, 0, 0, 0, 25, 5],
  20041: [10, 0, 0, 0, 10, 0, 20, 5],
  20042: [30, 0, 10, 0, 0, 0, -20, 5],
  20043: [0, 0, 0, 0, 0, 0, 25, 5],
  20044: [20, 0, 0, 0, 0, 0, 0, 5],
  20045: [0, 0, 5, 0, 0, 25, 10, 5],
  20046: [10, 0, 0, 0, 0, 30, 0, 5],
  20047: [0, 0, 0, 0, 0, 10, 20, 5],
  20048: [0, 0, 7, 7, 0, 10, 0, 15],
  20049: [10, 0, 0, 0, 0, 40, 0, 5],
  20050: [15, 25, 0, 0, 0, 0, 0, 5],
  20051: [5, 0, 5, 5, 0, 0, 30, 5],
  20052: [17, 0, 10, 17, 0, 7, -10, 5],
  20053: [0, 10, 10, 0, 0, 30, 10, 5],
  20054: [0, 25, 0, 0, 0, 10, 0, 5],
  20055: [7, 0, 7, 0, 0, 0, 10, 10],
  20056: [7, 0, 7, 0, 0, 0, 20, 5],
  20057: [0, 0, 0, 15, 0, 40, 0, 5],
  20058: [0, 30, 0, 0, 0, 0, 0, 5],
  20059: [-15, 0, 50, 0, 0, 0, 0, 5],
  20060: [0, 0, 25, 10, 0, 0, 10, 5],
  20061: [0, 7, 0, 7, 0, 0, 25, 5],
  20062: [20, 0, 0, 0, 10, 0, 0, 5],
  20063: [15, 0, 0, 0, 0, 0, 15, 5],
  20064: [10, 20, 0, 0, 0, 0, 0, 5],
  20065: [0, 0, 30, 0, 0, 10, 0, 5],
  20066: [0, 5, 0, 0, 0, 10, 10, 5],
  20067: [0, 0, 0, 0, 25, 0, 0, 5],
  20068: [0, 15, 0, 0, 0, 10, 15, 10],
  20069: [25, 0, 10, 0, 0, 0, 0, 10],
  20070: [5, 0, 5, 20, 0, 0, 0, 10],
  20071: [0, 0, 10, 0, 0, 10, 15, 10],
  20072: [0, 0, 0, 0, 10, 5, 15, 10],
  20073: [10, 0, 0, 0, 0, 25, 0, 10],
  20074: [0, 25, 0, 5, 0, 0, 0, 20],
  20075: [5, 0, 5, 20, 0, 0, 0, 20],
  20076: [0, 20, 10, 0, 0, 0, 15, 10],
  20077: [5, 0, 0, 0, 5, 0, 40, 10],
  20078: [35, 0, 0, 0, 0, 0, 0, 10],
  20079: [15, 0, 15, 15, 0, 0, 0, 10],
  20080: [0, 0, 0, 0, 25, 0, 10, 10],
  20081: [0, 0, 25, 5, 0, 0, 0, 10],
  20082: [30, 0, 0, 0, 0, 5, 0, 10],
  20083: [0, 20, 5, 5, 0, 0, 0, 15],
  20084: [0, 0, 0, 0, 35, 0, 0, 10],
  20085: [10, 0, 10, 20, 0, 10, 0, 10],
  20086: [20, 0, 0, 0, 0, 10, 0, 10],
  20087: [0, 0, 30, 0, 0, 0, 0, 15],
  20088: [0, 25, 0, 10, 0, 10, 0, 10],
  20089: [0, 0, 0, 15, 0, 0, 0, 10],

  30001: [35, 35, 0, 25, 0, 0, -20, 0],
  30002: [30, 0, 10, 0, 0, 0, 0, 5],
  30003: [15, 0, 0, 0, 5, 0, 30, 0],
  30004: [0, 55, 0, 25, 0, 35, -20, 5],
  30005: [0, 0, 50, 0, 0, 60, 0, 5],
  30006: [15, 0, 0, 15, 20, 15, 25, 5],
  30007: [0, 0, 25, 10, 0, 0, 30, 5],
  30008: [25, 25, 0, 0, 15, 5, 30, 5],
  30009: [0, 35, 20, 5, 0, 0, 0, 5],
  30010: [0, 0, 0, 5, 15, 45, -10, 5],
  30011: [5, 5, 0, 40, 5, 30, -30, 0],
  30012: [0, 5, 0, 50, 0, 0, 0, 5],
  30013: [0, 35, 0, 0, 35, 60, 0, 0],
  30014: [20, 20, 0, 0, 0, 0, 50, 5],
  30015: [25, 0, 10, 0, 0, 0, 0, 0],
  30016: [0, 20, 10, 0, 0, 0, 10, 0],
  30017: [25, 0, 25, 0, 25, 0, 0, 5],
  30018: [5, 0, 0, 0, 40, 10, -10, 5],
  30019: [0, 0, 0, 0, 0, 0, 45, 0],
  30020: [15, 0, 5, 15, 0, 0, 0, 0],
  30021: [25, 10, 5, 5, 15, 70, 160, 10],
  30022: [0, 30, 0, 0, 0, 0, -10, 0],
  30023: [0, 10, 0, 10, 0, 0, -10, 5],
  30024: [0, 0, 25, 10, 0, 25, 0, 0],
  30025: [30, 0, 0, 0, 0, 10, 10, 0],
  30026: [50, 0, 0, 0, 0, 0, -10, 5],
  30027: [0, 35, 0, 35, 5, 0, -5, 5],
  30028: [12, 0, 12, 0, 2, 0, 10, 5],
  30029: [0, 52, 0, 2, 3, 0, 25, 0],
  30030: [0, 0, 15, 0, 0, 25, 30, 5],
  30031: [0, 0, 20, 20, 20, 0, 0, 5],
  30032: [15, 10, 25, 0, 0, 40, 10, 0],
  30033: [0, 15, 15, 0, 0, 0, -40, 0],
  30034: [0, 5, 20, 0, 5, 0, 15, 5],

  30036: [10, 95, 5, 55, 0, 20, 125, 17],
  30037: [10, 0, 25, 10, 0, 35, 0, 10],
  30038: [0, 60, 0, 0, 0, 35, -15, 5],
  30039: [25, 0, 0, 20, 0, 0, 0, 5],
  30040: [0, 10, 0, 30, 0, 0, 30, 5],
  30041: [0, 0, 0, 8, 8, 50, -20, 5],
  30042: [0, 33, 43, 18, 0, 0, -20, 0],
  30043: [0, 15, 0, 15, 0, 50, -10, 5],
  30044: [45, 0, 0, 0, 0, 0, -20, 0],
  30045: [5, 0, 0, 0, 5, 35, 10, 5],
  30046: [25, 35, 0, 25, 0, 0, 0, 5],
  30047: [3, 0, 18, 0, 8, 0, -5, 5],
  30048: [0, 0, 20, 10, 10, 15, 0, 0],

  30052: [47, 0, 0, 77, 0, 30, 180, 15],
  30053: [17, 0, 32, 10, 0, 0, 0, 5],
  30054: [5, 0, 0, 5, 10, 0, 20, 5],
  30055: [0, 0, 0, 0, 25, 30, 10, 5],
  30056: [0, 15, 65, 0, 0, 20, -15, 5],
  30057: [25, 15, 0, 0, 0, 0, -25, 5],
  30058: [0, 7, 17, 0, 0, 0, 10, 5],
  30059: [5, 15, 0, 0, 0, 10, 0, 5],
  30060: [7, 0, 7, 30, 0, 0, -25, 5],
  30061: [0, 0, 10, 0, 10, 10, 0, 5],
  30062: [15, 15, 0, 0, 0, 10, 0, 0],
  30063: [0, 60, 0, 25, 5, 20, 0, 10],
  30064: [25, 0, 35, 0, 0, 0, 0, 5],
  30065: [0, 0, 0, 0, 30, 35, 0, 0],
  30066: [0, 10, 0, 0, 35, 0, 0, 5],
  30067: [80, 0, 0, 0, 155, 85, 90, 15],
  30068: [10, 0, 0, 0, 30, 20, 0, 5],
  30069: [0, 25, 5, 0, 0, 0, -5, 0],
  30070: [0, 5, 0, 30, 15, 0, -30, 5],
  30071: [20, 0, 45, 0, 0, 20, -20, 5],
  30072: [40, 0, 0, 20, 0, 0, 10, 5],
  30073: [0, 30, 0, 0, 20, 0, -5, 5],
  30074: [15, 0, 0, 0, 0, 10, 10, 0],
  30075: [0, 35, 0, 0, 15, 0, 0, 0],
  30076: [30, 0, 0, 0, 0, 20, 0, 0],
  30077: [0, 0, 22, 0, 17, 0, 15, 5],
  30078: [21, 21, 21, 21, 21, 7, 0, 7],
  30079: [8, 13, 3, 0, 0, 10, -10, 5],
  30080: [30, 30, 30, 30, 30, 65, 110, 0],
  30081: [68, 37, 63, 15, 15, 60, 90, 10],
  30082: [0, 0, 0, 0, 10, 25, 20, 5],
  30083: [20, 0, 0, 30, 0, 0, 0, 5],
  30084: [35, 5, 0, 0, 0, 10, -10, 5],
  30085: [0, 15, 15, 0, 0, 50, 0, 5],
  30086: [22, 22, 0, 0, 7, 30, 0, 5],
  30087: [0, 30, 0, 0, 10, 0, 10, 10],
  30088: [10, 0, 0, 0, 50, 0, 0, 5],
  30089: [0, 0, 0, 35, 10, 50, -20, 5],
  30090: [0, 20, 0, 0, 0, 50, 10, 5],
  30091: [10, 0, 0, 0, 40, 0, 15, 5],
  30092: [35, 0, 10, 0, 0, 10, 0, 5],
  30093: [0, 0, 25, 0, 15, 20, 0, 5],
  30094: [0, 20, 15, 50, 0, 0, -25, 1],
  30095: [24, 0, 20, 7, 17, 10, 0, 5],
  30096: [0, 0, 60, 0, 0, 0, -30, 5],
  30097: [0, 0, 10, 0, 30, 10, 20, 5],
  30098: [0, 4, 12, 0, 0, 2, 90, 5],
  30099: [0, 30, 0, 0, 13, 0, 30, 5],
  30100: [0, 0, 0, 0, 40, 0, 5, 5],
  30101: [10, 10, 0, 0, 10, 40, 10, 5],
  30102: [12, 0, 7, 37, 0, 30, 0, 5],
  30103: [7, 7, 7, 7, 0, 50, 0, 5],
  30104: [0, 30, 0, 0, 10, 10, 0, 5],
  30105: [20, 10, 10, 10, 10, 0, -10, 5],
  30106: [0, 0, 27, 0, 17, 0, 0, 5],
  30107: [60, 0, 5, 0, 15, 0, 0, 15],
  30108: [20, 20, 0, 0, 30, 50, 10, 5],
  30109: [0, 0, 0, 35, 0, 10, 0, 5],
  30110: [0, 15, 0, 0, 0, 0, 75, 5],
  30111: [0, 0, 25, 0, 40, 0, 0, 5],
  30112: [40, 0, 0, 40, 0, 15, -25, 5],
  30113: [0, 30, 0, 0, 0, 10, 0, 5],
  30114: [0, 0, 40, 0, 0, 25, 10, 5],
  30115: [30, 15, 0, 0, 0, 30, 0, 5],
  30116: [30, 0, 0, 10, 0, 70, 0, 5],
  30117: [15, 0, 15, 20, 0, 10, 0, 5],
  30118: [0, 22, 7, 32, 0, 10, 15, 5],
  30119: [20, 0, 0, 0, 0, 5, 15, 0],
  30120: [17, 0, 17, 17, 0, 55, 0, 5],
  30121: [30, 0, 0, 0, 0, 15, 0, 5],
  30122: [5, 0, 10, 0, 0, 15, 50, 5],
  30123: [0, 35, 35, 0, 0, 0, 0, 5],
  30124: [17, 0, 0, 0, 27, 0, 20, 5],
  30125: [0, 25, 0, 10, 0, 0, 0, 5],
  30126: [7, 0, 7, 25, 0, 0, 20, 5],
  30127: [8, 15, 0, 8, 0, 0, 40, 5],
  30128: [0, 0, 15, 0, 30, 25, 0, 10],
  30129: [0, 5, 20, 0, 0, 0, 15, 5],
  30130: [17, 0, 7, 17, 0, 15, 15, 5],
  30131: [17, 17, 17, 7, 7, 10, 0, 5],
  30132: [17, 0, 17, 7, 0, 10, 0, 5],
  30133: [5, 0, 5, 0, 20, 5, 10, 5],
  30134: [17, 12, 0, 0, 15, 15, 15, 5],
  30135: [20, 0, 0, 10, 0, 20, 0, 5],
  30136: [0, 14, 0, 14, 0, 10, 10, 5],
  30137: [48, 59, 55, 55, 44, 112, 183, 10],
  30138: [0, 27, 27, 0, 0, 0, 0, 5],
  30139: [0, 37, 0, 17, 0, 35, 10, 5],
  30140: [20, 0, 15, 0, 0, 0, 10, 5],
  30141: [10, 0, 10, 0, 30, 10, 10, 10],
  30142: [0, 40, 10, 10, 0, 10, 0, 10],
  30143: [0, 7, 12, 0, 7, 0, 10, 5],

  30145: [0, 25, 40, 0, 0, 15, 0, 5],
  30146: [20, 0, 0, 0, 10, 50, 30, 5],
  30147: [45, 25, 0, 0, 0, 0, 0, 15],
  30148: [20, 0, 20, 10, 0, 0, 25, 5],
  30149: [25, 0, 0, 10, 25, 10, 0, 10],
  30150: [5, 35, 5, 5, 0, 0, 0, 5],
  30151: [0, 15, 25, 0, 0, 50, 0, 5],
  30152: [10, 10, 0, 0, 20, 15, 0, 5],
  30153: [10, 0, 10, 20, 0, 25, 0, 5],
  30154: [17, 17, 17, 0, 0, 20, 10, 5],
  30155: [10, 0, 0, 10, 10, 15, 0, 5],
  30156: [0, 0, 40, 10, 0, 20, 15, 5],
  30157: [0, 25, 0, 0, 15, 0, 25, 5],
  30158: [10, 0, 0, 55, 0, 15, 15, 15],
  30159: [35, 0, 0, 0, 0, 0, -5, 5],
  30160: [0, 0, 20, 110, 0, 35, 155, 15],
  30161: [25, 10, 0, 0, 0, 10, 20, 15],
  30162: [0, 25, 0, 0, 0, 10, 10, 5],
  30163: [15, 15, 0, 0, 60, 40, 0, 15],
  30164: [0, 0, 35, 40, 0, 0, 15, 10],
  30165: [0, 25, 0, 25, 0, 15, 40, 15],
  30166: [10, 0, 10, 35, 0, 0, 15, 20],
  30167: [25, 0, 0, 0, 0, 10, 0, 15],
  30168: [50, 0, 0, 0, 0, 15, 0, 25],
  30169: [0, 20, 55, 0, 0, -10, 45, 15],
  30170: [30, 0, 30, 0, 0, 10, 15, 15],
  30171: [0, 10, 10, 0, 0, 15, 0, 15],
  30172: [30, 0, 0, 0, 10, 40, 30, 25],
  30173: [0, 10, 0, 0, 0, 40, 55, 20],
  30174: [40, 0, 25, 0, 0, 0, 40, 15],
  30175: [0, 10, 45, 0, 0, 15, 15, 25],
  30176: [10, 0, 5, 20, 0, 0, 0, 15],
  30177: [0, 0, 0, 0, 25, 25, 30, 15],
  30178: [35, 0, 20, 0, 0, 30, 0, 20],
  30179: [10, 0, 0, 0, 50, 10, 10, 25],
  30180: [0, 37, 0, 27, 0, 105, 17, 25],
  30181: [0, 45, 0, 0, 0, 0, 0, 15],
  30182: [0, 25, 0, 15, 0, 35, 25, 15],
  30183: [0, 0, 40, 20, 0, 20, 0, 15],
  30184: [35, 0, 15, 0, 0, 0, 25, 20],
  30185: [0, 0, 0, 0, 10, 0, 10, 15],
  30186: [20, 0, 0, 0, 0, 0, 0, 15],
  30187: [0, 0, 0, 20, 0, 15, 25, 15],
  30188: [80, 0, 0, 0, 10, 185, 0, 25],
  30189: [0, 0, 10, 25, 0, 10, 0, 15],
  30190: [0, 40, 0, 0, 0, 0, 0, 15],
  30191: [0, 5, 35, 0, 0, 0, 0, 10],
  30192: [20, 0, 0, 0, 0, 0, 25, 15],
  30193: [0, 60, 0, 30, 0, 0, 15, 15],
  30194: [5, 0, 5, 45, 0, 0, 0, 15],
  30195: [0, 0, 50, 15, 0, 0, 30, 15],
  30196: [40, 0, 10, 0, 0, 30, 0, 15],
  30197: [0, 0, 20, 10, 0, 0, 0, 15],
  30198: [10, 0, 0, 0, 80, 10, 0, 15],
  30199: [0, 45, 0, 10, 0, 25, 15, 15],
  30200: [10, 0, 5, 20, 0, 0, 0, 15],
  30201: [15, 0, 0, 0, 55, 15, 0, 15],
  30202: [12, 0, 12, 30, 0, 10, 0, 15],
  30203: [0, 10, 10, 0, 0, 0, 20, 15],
  30204: [0, 25, 40, 0, 0, 0, 15, 25],
  30205: [20, 0, 5, 0, 0, 0, 25, 15],
  30206: [25, 0, 25, 0, 0, 30, 0, 30],
  30207: [10, 0, 0, 91, 0, 163, 0, 25],
  30208: [0, 0, 20, 20, 0, 20, 20, 20],
  30209: [0, 30, 0, 30, 0, 0, 45, 15],
  30210: [65, 0, 0, 0, 0, 35, 0, 15],
  30211: [10, 0, 0, 0, 65, 10, 0, 25],
  30212: [0, 15, 0, 30, 0, 0, 0, 15],
  30213: [40, 0, 0, 0, 0, 0, 0, 15],
  30214: [0, 0, 0, 30, 0, 55, 0, 15],
  30215: [25, 0, 15, 0, 0, 25, 40, 20],
  30216: [10, 0, 10, 30, 0, 0, 0, 15],
  30217: [10, 0, 0, 0, 35, 0, 10, 15],
  30218: [15, 0, 0, 0, 40, 0, 20, 20],
  30219: [5, 0, 5, 30, 0, 20, 25, 20],
  30220: [5, 0, 0, 0, 20, 0, 10, 15],
  30221: [0, 15, 0, 0, 0, 25, 0, 15],
  30222: [0, 20, 50, 0, 0, 25, 15, 15],
  30223: [10, 0, 10, 30, 0, 30, 0, 20],
  30224: [30, 0, 25, 0, 0, 35, 0, 25],
  30225: [5, 0, 5, 25, 0, 0, 0, 15],
  30226: [0, 25, 0, 0, 0, 50, 0, 25],
  30227: [10, 0, 0, 0, 40, 30, 0, 20],
  30228: [0, 30, 55, 0, 0, 10, 0, 15],
  30229: [20, 0, 0, 0, 50, 20, 10, 15],
  30230: [40, 0, 25, 0, 0, 15, 0, 25],
  30231: [0, 10, 10, 0, 0, 0, 30, 15],
  30232: [0, 0, 0, 40, 0, 20, 20, 15],
  30233: [10, 0, 0, 0, 35, 25, 25, 15],
  30234: [0, 10, 25, 30, 0, 35, 0, 25],
  30235: [30, 0, 0, 0, 0, 5, 0, 15],
  30236: [45, 0, 30, 0, 0, 0, 0, 20],
  30237: [45, 0, 15, 30, 0, 5, 0, 15],
  30238: [0, 0, 0, 0, 80, 0, 0, 20],
  30239: [0, 30, 0, 0, 0, 5, 0, 15],
  30240: [0, 45, 0, 0, 0, 0, 0, 15],
  30241: [15, 30, 20, 10, 10, 230, 109, 25],
  30242: [60, 0, 30, 0, 0, 30, 0, 20],
  30243: [0, 0, 15, 0, 0, 15, 0, 15],
  30244: [0, 40, 0, 20, 0, 0, 0, 15],
  30245: [0, 10, 45, 0, 0, 10, 15, 25],
  30246: [50, 0, 5, 0, 0, 15, 0, 15],
  30247: [10, 0, 25, 0, 0, 10, 0, 15],
  30248: [20, 0, 0, 0, 45, 10, 15, 15],
  30249: [15, 0, 15, 50, 0, 0, 0, 15],
  30250: [0, 20, 65, 0, 0, 15, 0, 25],
  30251: [0, 0, 0, 35, 0, 0, 0, 15],
  30252: [0, 0, 0, 55, 0, 40, 0, 15],
  30253: [60, 0, 10, 0, 0, 10, 0, 15],
  30254: [30, 0, 0, 0, 65, 10, 15, 20],
  30255: [0, 0, 0, 0, 30, 0, 0, 15],
  30256: [0, 10, 60, 0, 0, 20, 0, 17],
  30257: [30, 50, 30, 15, 0, 145, 0, 25],
  30258: [0, 30, 10, 20, 0, 0, 0, 15],
  30259: [35, 0, 0, 0, 0, 5, 10, 15],
  30260: [35, 0, 0, 0, 0, 10, 0, 15],
  30261: [15, 0, 0, 0, 60, 10, 0, 15],
  30262: [0, 55, 0, 0, 0, 20, 25, 15],
  30263: [0, 0, 35, 0, 0, 0, 0, 15],
  30264: [0, 50, 0, 55, 0, 10, 15, 15],
  30265: [55, 0, 0, 0, 0, 20, 0, 20],
  30266: [0, 0, 0, 0, 25, 15, 0, 20],
  30267: [80, 0, 0, 0, 0, 0, 0, 25],
  30268: [0, 0, 0, 0, 50, 20, 0, 20],
  30269: [30, 0, 0, 0, 0, 5, 0, 15],
}


// Scenario configurations for the Uma Musume tier list.
//
// Each scenario describes weights and training gains used by the calculator.
// The JP and Global servers tweak a few constants (most notably bondPerDay
// and certain scenarioLink character names), so we keep one full bundle per
// server here. The shape of every scenario object is identical to the
// previous inline `defaultXxxState()` returns inside Weights.jsx so the
// component can consume them as-is.

const jp = {
  DYI: {
    version: 30,
    currentState: "speed",
    show: false,
    general: {
      bondPerDay: 15,
      races: [10, 2, 0, 3],
      unbondedTrainingGain: [
        [12, 0, 1, 0, 0, 6, 20],
        [0, 9, 0, 5, 0, 6, 20],
        [0, 3, 11, 0, 0, 6, 20],
        [2, 0, 2, 10, 0, 6, 20],
        [2, 0, 0, 0, 8, 5, 0],
      ],
      bondedTrainingGain: [
        [15, 0, 2, 0, 0, 6, 23],
        [0, 11, 0, 6, 0, 6, 23],
        [0, 4, 14, 0, 0, 6, 23],
        [3, 0, 2, 13, 0, 6, 23],
        [3, 0, 0, 0, 11, 5, 0],
      ],
      summerTrainingGain: [
        [17, 0, 3, 0, 0, 6, 25],
        [0, 13, 0, 7, 0, 6, 25],
        [0, 5, 16, 0, 0, 6, 25],
        [3, 0, 3, 15, 0, 6, 25],
        [4, 0, 0, 0, 13, 5, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1,
      bonusSpec: 20,
      motivation: 0.2,
      scenarioLink: ["タッカーブライン"],
      scenarioBonus: 1000,
      fanBonus: 0.05,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 1, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
  GM: {
    version: 26,
    currentState: "speed",
    show: false,
    general: {
      bondPerDay: 15,
      races: [10, 2, 0, 5],
      unbondedTrainingGain: [
        [10, 0, 3, 0, 0, 5, 19],
        [0, 8, 0, 6, 0, 5, 20],
        [0, 4, 9, 0, 0, 5, 20],
        [2, 0, 3, 9, 0, 5, 20],
        [2, 0, 0, 0, 8, 5, 0],
      ],
      bondedTrainingGain: [
        [13, 0, 4, 0, 0, 5, 23],
        [0, 9, 0, 6, 0, 5, 21],
        [0, 4, 10, 0, 0, 5, 21],
        [3, 0, 3, 12, 0, 5, 24],
        [3, 0, 0, 0, 11, 5, 0],
      ],
      summerTrainingGain: [
        [14, 0, 5, 0, 0, 5, 24],
        [0, 12, 0, 8, 0, 5, 25],
        [0, 6, 13, 0, 0, 5, 25],
        [4, 0, 4, 13, 0, 5, 25],
        [4, 0, 0, 0, 12, 5, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1.25,
      bonusSpec: 0,
      motivation: 0.2,
      scenarioLink: ["ダーレーアラビアン"],
      scenarioBonus: 150,
      fanBonus: 0.1,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 1, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
  GL: {
    version: 18,
    currentState: "speed",
    show: false,
    general: {
      bondPerDay: 20,
      races: [7, 2, 0, 3],
      unbondedTrainingGain: [
        [8, 0, 4, 0, 0, 2, 19],
        [0, 8, 0, 6, 0, 2, 20],
        [0, 4, 9, 0, 0, 2, 20],
        [2, 0, 2, 7, 0, 2, 20],
        [2, 0, 0, 0, 6, 3, 0],
      ],
      bondedTrainingGain: [
        [11, 0, 5, 0, 0, 2, 23],
        [0, 9, 0, 6, 0, 2, 21],
        [0, 4, 10, 0, 0, 2, 21],
        [3, 0, 2, 10, 0, 2, 24],
        [3, 0, 0, 0, 9, 3, 0],
      ],
      summerTrainingGain: [
        [12, 0, 6, 0, 0, 2, 24],
        [0, 12, 0, 8, 0, 2, 25],
        [0, 6, 13, 0, 0, 2, 25],
        [3, 0, 3, 11, 0, 2, 25],
        [4, 0, 0, 0, 10, 3, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1.4,
      bonusSpec: 20,
      motivation: 0.2,
      scenarioLink: [
        "ミホノブルボン",
        "Mihono Bourbon",
        "ライトハロー",
        "Light Hello",
        "スマートファルコン",
        "Smart Falcon",
        "アグネスタキオン",
        "Agnes Tachyon",
        "サイレンススズカ",
        "Silence Suzuka",
      ],
      scenarioBonus: 75,
      fanBonus: 0.05,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 0.5, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 0.5, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
  MANT: {
    version: 18,
    currentState: "speed",
    show: false,
    general: {
      bondPerDay: 20,
      races: [15, 10, 2, 3],
      unbondedTrainingGain: [
        [8, 0, 4, 0, 0, 2, 19],
        [0, 7, 0, 3, 0, 2, 17],
        [0, 4, 6, 0, 0, 2, 18],
        [3, 0, 3, 6, 0, 2, 20],
        [2, 0, 0, 0, 6, 3, 0],
      ],
      bondedTrainingGain: [
        [10, 0, 4, 0, 0, 2, 21],
        [0, 8, 0, 3, 0, 2, 18],
        [0, 4, 7, 0, 0, 2, 19],
        [4, 0, 3, 9, 0, 2, 24],
        [3, 0, 0, 0, 9, 3, 0],
      ],
      summerTrainingGain: [
        [12, 0, 6, 0, 0, 2, 24],
        [0, 11, 0, 5, 0, 2, 22],
        [0, 6, 10, 0, 0, 2, 23],
        [4, 0, 4, 10, 0, 2, 25],
        [4, 0, 0, 0, 10, 3, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1.4,
      bonusSpec: 0,
      motivation: 0.2,
      scenarioLink: [],
      scenarioBonus: 0,
      fanBonus: 0.15,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 1, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
  Aoharu: {
    version: 18,
    currentState: "wisdom",
    show: false,
    general: {
      bondPerDay: 20,
      races: [7, 2, 0, 3],
      unbondedTrainingGain: [
        [8, 0, 4, 0, 0, 4, 19],
        [0, 8, 0, 6, 0, 4, 20],
        [0, 4, 9, 0, 0, 4, 20],
        [3, 0, 3, 6, 0, 4, 20],
        [2, 0, 0, 0, 6, 5, 0],
      ],
      bondedTrainingGain: [
        [12, 0, 5, 0, 0, 4, 24],
        [0, 12, 0, 7, 0, 4, 25],
        [0, 5, 13, 0, 0, 4, 25],
        [4, 0, 3, 10, 0, 4, 25],
        [3, 0, 0, 0, 10, 5, 0],
      ],
      summerTrainingGain: [
        [13, 0, 6, 0, 0, 4, 25],
        [0, 13, 0, 8, 0, 4, 26],
        [0, 6, 14, 0, 0, 4, 26],
        [4, 0, 4, 11, 0, 4, 26],
        [4, 0, 0, 0, 11, 5, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1,
      bonusSpec: 0,
      motivation: 0.2,
      scenarioLink: [
        "マチカネフクキタル",
        "ハルウララ",
        "樫本理子",
        "ライスシャワー",
        "タイキシャトル",
      ],
      scenarioBonus: 40,
      fanBonus: 0.05,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 1, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
  URA: {
    version: 18,
    currentState: "speed",
    show: false,
    general: {
      bondPerDay: 20,
      races: [7, 2, 0, 3],
      unbondedTrainingGain: [
        [11, 0, 6, 0, 0, 4, 21],
        [0, 10, 0, 6, 0, 4, 19],
        [0, 6, 9, 0, 0, 4, 20],
        [5, 0, 5, 8, 0, 4, 22],
        [2, 0, 0, 0, 10, 5, 0],
      ],
      bondedTrainingGain: [
        [13, 0, 6, 0, 0, 4, 23],
        [0, 11, 0, 6, 0, 4, 21],
        [0, 6, 11, 0, 0, 4, 22],
        [5, 0, 5, 10, 0, 4, 24],
        [2, 0, 0, 0, 12, 5, 0],
      ],
      summerTrainingGain: [
        [15, 0, 8, 0, 0, 4, 24],
        [0, 14, 0, 7, 0, 4, 25],
        [0, 8, 13, 0, 0, 4, 25],
        [6, 0, 6, 12, 0, 4, 25],
        [4, 0, 0, 0, 14, 5, 0],
      ],
      umaBonus: [1.06, 1.06, 1.06, 1.06, 1.06, 1],
      multi: 1,
      bonusSpec: 0,
      motivation: 0.2,
      scenarioLink: ["桐生院葵"],
      scenarioBonus: 16,
      fanBonus: 0.05,
    },
    speed: {
      type: 0,
      stats: [2, 0.5, 2.5, 0.5, 0.5, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    stamina: {
      type: 1,
      stats: [1, 2.5, 1, 1.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    power: {
      type: 2,
      stats: [1, 2, 2, 0.5, 1, 1, 1],
      cap: 500,
      minimum: 0,
      prioritize: false,
      onlySummer: false,
    },
    guts: {
      type: 3,
      stats: [2.5, 1.5, 2.5, 1, 1, 1, 1],
      cap: 400,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    wisdom: {
      type: 4,
      stats: [1.5, 1.5, 1.5, 1, 2, 1, 1],
      cap: 300,
      minimum: 0,
      prioritize: true,
      onlySummer: false,
    },
    friend: {
      type: 6,
      stats: [1, 1, 1, 1, 1, 1, 1],
      cap: 500,
      minimum: 0,
    },
  },
}

// Global server scenarios. They share the JP shape but tweak a few constants
// (notably bondPerDay defaults and a translated URA scenarioLink name).
const gl = {
  GM: { ...jp.GM, general: { ...jp.GM.general, bondPerDay: 10 } },
  GL: { ...jp.GL, general: { ...jp.GL.general, bondPerDay: 10 } },
  MANT: { ...jp.MANT, general: { ...jp.MANT.general, bondPerDay: 10 } },
  Aoharu: { ...jp.Aoharu, general: { ...jp.Aoharu.general, bondPerDay: 10 } },
  URA: {
    ...jp.URA,
    general: {
      ...jp.URA.general,
      bondPerDay: 10,
      scenarioLink: ["Aoi Kiryuin"],
    },
  },
}

const SCENARIOS_BY_SERVER = { jp, gl }

const SERVER_CONFIG = {
  jp: {
    availableScenarios: ["DYI", "GM", "GL", "MANT", "Aoharu", "URA"],
    defaultScenario: "DYI",
    referenceDocUrl:
      "https://docs.google.com/document/d/1gNcV7XLmxx0OI2DEAR8gmKb8P9BBhcwGhlJOVbYaXeo/edit?usp=sharing",
    defaultLocale: "en-jp",
    defaultPresetCards: [30226, 30256, 30187, 30233, 30257],
    defaultFilters: {
      ssr: [true, false, false, false, false],
      sr: [true, false, false, false, false],
      r: [false, false, false, false, false],
    },
    defaultTierListDropdown: "none",
    // The JP cards.js stores fs_bonus in a different format than Global.
    // Preserve the original per-server display formula.
    useLegacyFsBonusDisplay: true,
    // Preset deck IDs shown in SelectedCards.
    deckPresets: [
      { key: "speed-power", cards: [20023, 20033, 20009, 20003, 30137] },
      { key: "speed-stamina", cards: [20023, 20033, 20008, 30022, 30137] },
      { key: "speed-int", cards: [20023, 20033, 20012, 20002, 30137] },
      { key: "guts-int", cards: [30028, 20048, 20041, 20012, 20002] },
      { key: "aoharu-parent", cards: [20012, 20016, 20025, 20002, 10060] },
      { key: "highlander", cards: [30028, 20008, 20009, 30019, 20012] },
      { key: "race-bonus", cards: [20031, 30074, 20027, 20012, 30054] },
    ],
  },
  gl: {
    availableScenarios: ["DYI", "GM", "GL", "MANT", "Aoharu", "URA"],
    defaultScenario: "GL",
    referenceDocUrl:
      "https://docs.google.com/document/d/11X2P7pLuh-k9E7PhRiD20nDX22rNWtCpC1S4IMx_8pQ/edit?usp=sharing",
    defaultLocale: "en-gl",
    defaultPresetCards: [20031, 20033, 20012, 20015, 30052],
    defaultFilters: {
      ssr: [true, false, true, false, true],
      sr: [true, false, true, false, true],
      r: [false, false, false, false, true],
    },
    defaultTierListDropdown: "race_bonus",
    useLegacyFsBonusDisplay: false,
    deckPresets: [
      { key: "speed-power", cards: [30028, 20031, 20033, 20009, 20003] },
      { key: "speed-stamina", cards: [30028, 20031, 20033, 20008, 30022] },
      { key: "speed-int", cards: [30028, 20031, 20033, 20012, 20002] },
      { key: "guts-int", cards: [30011, 30030, 30019, 20012, 20002] },
      { key: "race-bonus", cards: [20031, 30074, 20027, 20012, 30054] },
    ],
  },
}

function getServerConfig(server) {
  return SERVER_CONFIG[server] || SERVER_CONFIG.jp
}

function getScenarios(server) {
  return SCENARIOS_BY_SERVER[server] || SCENARIOS_BY_SERVER.jp
}

// Clone-on-read so component state mutation does not leak back into the
// shared scenario definitions.
function getScenario(server, scenarioKey) {
  const scenarios = getScenarios(server)
  const scenario =
    scenarios[scenarioKey] || scenarios[getServerConfig(server).defaultScenario]
  return JSON.parse(JSON.stringify(scenario))
}

function getDefaultScenario(server) {
  return getScenario(server, getServerConfig(server).defaultScenario)
}



// ─── Conventions used throughout this file ───────────────────────────────────
//
// A card's `type` indexes into the same array as the stats it can give:
//   0 Speed · 1 Stamina · 2 Power · 3 Guts · 4 Wit · 5 skill points · 6 energy
// Trainings only exist for 0..4. There's no card type for skill points (5),
// leaving a gap, and GROUP_TYPE (6, energy) is used for group ("friend") cards
// that aren't tied to a single training.
//
// Stat / gain arrays follow the same layout:
//   [0..4] the five training stats · [5] skill points · [6] energy
// Card-event arrays add one more slot: [7] bond.
//
// Card field shorthands (defined in the card data files):
//   sb  starting bond        tb  training bonus       mb  motivation bonus
//   fs_*  friendship ("rainbow") bonuses, applied only while the card rainbows
//   stat_bonus[6]  flat per-stat bonus   specialty_rate  specialty priority
//
// See CLAUDE.md in this folder for the underlying game mechanics.

const STAT_COUNT = 6 // five training stats + skill points
const TRAINING_COUNT = 5
const ENERGY = 6 // index of energy within gain / weight arrays
const BOND = 7 // index of bond within card-event arrays
const GROUP_TYPE = 6

// Appearance-rate weights (CLAUDE.md → "Appearance Rate"). Each of the five
// trainings has base weight 100; there's also a weight-50 "no training" option.
// For one card, P(lands on specialty) = specialty / (specialty + 450), where
// 450 = the other four trainings (4×100) plus the 50 no-training slot.
const BASE_WEIGHT = 100
const OTHER_SLOTS_WEIGHT = 450

// Bond points needed to start rainbowing, before the card's innate starting
// bond and any event bond are subtracted.
const GROUP_BOND = 55
const NORMAL_BOND = 75

// Each support card sharing a training adds 5% output: factor (1 + 0.05·N).
const CARD_BONUS = 0.05

const SUMMER_RAINBOW_DAYS = 8

const raceRewards = [
  [2, 2, 2, 2, 2, 35],
  [1.6, 1.6, 1.6, 1.6, 1.6, 25],
  [1, 1, 1, 1, 1, 20],
  [13.5, 13.5, 13.5, 13.5, 13.5, 50],
]

// Probability that this card lands on its specialty training (onSpecialty) vs.
// any single off-specialty training (offSpecialty).
function specialtyChances(card, weights) {
  const specialty =
    (BASE_WEIGHT + card.specialty_rate + weights.bonusSpec) *
    card.unique_specialty *
    card.fs_specialty
  return {
    onSpecialty: specialty / (OTHER_SLOTS_WEIGHT + specialty),
    offSpecialty: BASE_WEIGHT / (OTHER_SLOTS_WEIGHT + specialty),
  }
}

const deepClone = (value) => JSON.parse(JSON.stringify(value))

function processCards(cards, weights, selectedCards) {
  let processedCards = []
  selectedCards = deepClone(selectedCards)

  // Pre-process the fixed deck (the cards the user already picked): record
  // which training types are present, group cards by type, and tally the bond
  // the whole deck needs before anyone can rainbow.
  let presentTypes = [false, false, false, false, false, false, false]
  let cardsPerType = [[], [], [], [], [], [], []]
  let baseBondNeeded = 0
  for (let i = 0; i < selectedCards.length; i++) {
    let selectedCard = selectedCards[i]
    const chances = specialtyChances(selectedCard, weights)
    selectedCard.rainbowSpecialty = chances.onSpecialty
    selectedCard.offSpecialty = chances.offSpecialty
    selectedCard.cardType = selectedCard.type
    selectedCard.index = i
    presentTypes[selectedCard.cardType] = true
    cardsPerType[selectedCard.cardType].push(selectedCard)

    baseBondNeeded +=
      (selectedCard.cardType == GROUP_TYPE ? GROUP_BOND : NORMAL_BOND) -
      selectedCard.sb
    if (events[selectedCard.id]) {
      baseBondNeeded -= events[selectedCard.id][BOND]
    }
  }

  baseBondNeeded += NORMAL_BOND * (5 - selectedCards.length)

  // Chance that at least one off-type training rainbows on a given turn, used
  // later to discount a candidate's own rainbow rate (you can only be in one
  // training per turn). Skips the stat type the weights are optimising for.
  let preferredRainbowChances = [0, 0, 0, 0, 0]
  for (let type = 0; type < TRAINING_COUNT; type++) {
    if (type == weights.type) continue
    if (cardsPerType[type].length === 0) continue

    const minimum = weights.prioritize ? 2 : 1
    let combos = GetCombinations(cardsPerType[type], minimum)
    preferredRainbowChances[type] = combos.reduce(
      (total, combo) =>
        total + CalculateCombinationChance(combo, undefined, type),
      0
    )
  }

  let chanceOfPreferredRainbow =
    1 -
    preferredRainbowChances.reduce(
      (product, chance) => product * (1 - chance),
      1
    )

  // Score each candidate card as if it were added to the fixed deck.
  for (let i = 0; i < cards.length; i++) {
    let info = {}
    let card = deepClone(cards[i])
    let cardType = card.type
    card.index = 6 // distinct from the selected cards' indices (0..5)

    let bondNeeded =
      baseBondNeeded +
      (cardType == GROUP_TYPE ? GROUP_BOND : NORMAL_BOND) -
      card.sb

    let presentTypesWithCard = presentTypes.slice()
    presentTypesWithCard[cardType] = true
    let typeCount = presentTypesWithCard.filter(Boolean).length

    let score = card.sb
    let energyGain = 0
    let statGains = card.starting_stats.slice()
    statGains.push(0) // skill-points slot

    info.starting_stats = card.starting_stats.slice()
    info.event_stats = [0, 0, 0, 0, 0, 0, 0]

    // Event rewards (or, for cards without an event entry, the flat rarity
    // bonuses). Both also reduce the bond still needed and add to the score.
    if (events[card.id]) {
      info.event_stats = events[card.id].slice()
      for (let stat = 0; stat < STAT_COUNT; stat++) {
        statGains[stat] += events[card.id][stat] * card.effect_size_up
        info.event_stats[stat] = events[card.id][stat] * card.effect_size_up
      }
      energyGain += events[card.id][ENERGY] * card.energy_up
      bondNeeded -= events[card.id][BOND]
      score += events[card.id][BOND]
    } else {
      if (card.rarity === 2) {
        for (let stat = 0; stat < TRAINING_COUNT; stat++) statGains[stat] += 7
        bondNeeded -= 5
      } else if (card.rarity === 3) {
        for (let stat = 0; stat < TRAINING_COUNT; stat++) statGains[stat] += 9
        bondNeeded -= 5
      }
      score += 5
    }

    // "Initial <Stat>" bonuses granted once per card in the run: the candidate
    // plus every deck member. Group cards spread the bonus across all 5 stats.
    if (card.type_stats > 0) {
      statGains[card.type] += card.type_stats
      for (let s = 0; s < selectedCards.length; s++) {
        if (selectedCards[s].type < GROUP_TYPE) {
          statGains[selectedCards[s].type] += card.type_stats
        } else {
          for (let stat = 0; stat < TRAINING_COUNT; stat++) {
            statGains[stat] += card.type_stats / 5
          }
        }
      }
    }

    // Split the run's training days into the bonding phase (before the card
    // hits max bond) and the rainbow phase (after).
    let trainingDays =
      65 - weights.races[0] - weights.races[1] - weights.races[2]
    if (cardType === GROUP_TYPE) trainingDays -= 5
    let daysToBond = bondNeeded / weights.bondPerDay
    let rainbowDays = trainingDays - daysToBond

    const chances = specialtyChances(card, weights)
    let specialtyPercent = chances.onSpecialty
    let otherPercent = chances.offSpecialty
    let offstatAppearanceDenominator = card.offstat_appearance_denominator

    let daysPerTraining = [0, 0, 0, 0, 0]
    let bondedDaysPerTraining = [0, 0, 0, 0, 0]
    let rainbowTraining = 0

    // Non-group cards can only rainbow in one training per turn, so discount
    // their rainbow time by the chance a preferred off-type rainbow steals it.
    let rainbowOverride = 1
    if (cardType != GROUP_TYPE) {
      card.rainbowSpecialty = specialtyPercent
      card.offSpecialty = otherPercent
      let cardsOfThisType = cardsPerType[cardType].slice()
      cardsOfThisType.push(card)

      let chanceOfSingleRainbow = 0
      for (let j = 0; j < cardsOfThisType.length; j++) {
        chanceOfSingleRainbow += CalculateCombinationChance(
          [cardsOfThisType[j]],
          cardsOfThisType,
          cardType
        )
      }
      rainbowOverride = 1 - chanceOfPreferredRainbow * chanceOfSingleRainbow
    }

    // Distribute bonding-phase and rainbow-phase days across the trainings.
    for (let stat = 0; stat < TRAINING_COUNT; stat++) {
      if (stat == cardType) {
        rainbowTraining = specialtyPercent * rainbowDays * rainbowOverride
        daysPerTraining[stat] = specialtyPercent * daysToBond
      } else {
        daysPerTraining[stat] =
          (otherPercent / offstatAppearanceDenominator) * daysToBond
        bondedDaysPerTraining[stat] =
          (otherPercent / offstatAppearanceDenominator) * rainbowDays
      }
    }

    if (weights.onlySummer) {
      rainbowTraining = SUMMER_RAINBOW_DAYS * specialtyPercent * rainbowOverride
    }

    // Cards whose unique friendship bonus ramps up: average it over the first
    // ~2/3 of rainbow days, while the ramp is still climbing.
    if (card.fs_ramp[0] > 0) {
      let current_bonus = 0
      let total = 0
      for (let j = rainbowTraining * 0.66; j > 0; j--) {
        total += current_bonus
        current_bonus = Math.min(
          current_bonus + card.fs_ramp[0],
          card.fs_ramp[1]
        )
      }
      card.unique_fs_bonus = 1 + total / rainbowTraining / 100
    }

    // ── Bonding phase: off-specialty trainings, no friendship bonus ──
    info.non_rainbow_gains = [0, 0, 0, 0, 0, 0, 0]
    for (let training = 0; training < TRAINING_COUNT; training++) {
      let gains = weights.unbondedTrainingGain[training]
      let daysOnThisTraining = daysPerTraining[training]
      energyGain += daysOnThisTraining * gains[ENERGY] * card.energy_discount

      let trainingGains = CalculateCrossTrainingGain(
        gains,
        weights,
        card,
        selectedCards,
        training,
        daysOnThisTraining,
        typeCount,
        false
      )

      for (let stat = 0; stat < STAT_COUNT; stat++) {
        statGains[stat] += trainingGains[stat]
        info.non_rainbow_gains[stat] += trainingGains[stat]
      }
      info.non_rainbow_gains[ENERGY] +=
        daysOnThisTraining * gains[ENERGY] * card.energy_discount
    }

    // ── Rainbow phase: off-specialty trainings, deck members may rainbow ──
    for (let training = 0; training < TRAINING_COUNT; training++) {
      let gains = weights.bondedTrainingGain[training]
      let daysOnThisTraining = bondedDaysPerTraining[training]
      energyGain += daysOnThisTraining * gains[ENERGY] * card.energy_discount
      energyGain += daysOnThisTraining * gains[ENERGY] * card.fs_energy

      let trainingGains = CalculateCrossTrainingGain(
        gains,
        weights,
        card,
        selectedCards,
        training,
        daysOnThisTraining,
        typeCount,
        true
      )

      for (let stat = 0; stat < STAT_COUNT; stat++) {
        statGains[stat] += trainingGains[stat]
        info.non_rainbow_gains[stat] += trainingGains[stat]
      }

      info.non_rainbow_gains[ENERGY] +=
        daysOnThisTraining * gains[ENERGY] * card.energy_discount
      info.non_rainbow_gains[ENERGY] +=
        daysOnThisTraining * gains[ENERGY] * card.fs_energy

      if (training == 4 && card.group) {
        energyGain += (daysOnThisTraining * card.wisdom_recovery) / 5
      }
    }

    // ── Rainbow phase: the candidate's own specialty training ──
    info.rainbow_gains = [0, 0, 0, 0, 0, 0, 0]
    if (cardType < GROUP_TYPE) {
      energyGain += rainbowTraining * card.wisdom_recovery
      let specialtyGains = weights.onlySummer
        ? weights.summerTrainingGain[cardType]
        : weights.bondedTrainingGain[cardType]

      let trainingGains = CalculateTrainingGain(
        specialtyGains,
        weights,
        card,
        selectedCards,
        cardType,
        rainbowTraining,
        true,
        typeCount
      )

      info.rainbow_gains = trainingGains.slice()
      info.rainbow_gains.push(rainbowTraining * card.wisdom_recovery)

      for (let stat = 0; stat < STAT_COUNT; stat++) {
        statGains[stat] += trainingGains[stat]
      }
    }

    // Race rewards, scaled by the card's race bonus.
    info.race_bonus_gains = 0
    for (let raceType = 0; raceType < raceRewards.length; raceType++) {
      for (let stat = 0; stat < STAT_COUNT; stat++) {
        let gain =
          raceRewards[raceType][stat] *
          (card.race_bonus / 100) *
          weights.races[raceType]
        statGains[stat] += gain
        info.race_bonus_gains += gain
      }
    }

    score += GainsToScore(statGains, weights)
    score += energyGain * weights.stats[ENERGY]

    if (weights.scenarioLink.indexOf(card.char_name) > -1) {
      score += weights.scenarioBonus
    }

    processedCards.push({
      id: card.id,
      lb: card.limit_break,
      score: score,
      info: info,
      char_name: card.char_name,
    })
  }

  processedCards.sort((a, b) => b.score - a.score)
  return processedCards
}

// ─── Combination-bonus reducers ──────────────────────────────────────────────
// Each folds the bonuses contributed by the *other* cards sharing a training.
// Training and motivation bonuses add (less their identity of 1); friendship
// bonuses multiply, and only for cards on their own specialty training.

function comboTrainingBonus(combination, typeCount) {
  return combination.reduce((total, c) => {
    let training = total + (c.tb - 1) + combination.length * c.crowd_bonus
    if (typeCount >= c.highlander_threshold) training += c.highlander_training
    return training
  }, 1)
}

function comboFriendshipBonus(combination, trainingType) {
  return combination.reduce(
    (total, c) =>
      c.cardType === trainingType
        ? total * c.fs_bonus * c.unique_fs_bonus
        : total,
    1
  )
}

function comboMotivationBonus(combination) {
  return combination.reduce((total, c) => total + c.mb - 1, 1)
}

function comboStatBonus(combination, stat) {
  return combination.reduce((total, c) => total + c.stat_bonus[stat], 0)
}

// Gain from the candidate training on its own specialty. Sums over every way
// the deck members could join it that turn, weighted by how likely each is.
function CalculateTrainingGain(
  gains,
  weights,
  card,
  otherCards,
  trainingType,
  days,
  rainbow,
  typeCount
) {
  let trainingGains = [0, 0, 0, 0, 0, 0, 0]

  let trainingBonus = card.tb + card.fan_bonus * weights.fanBonus
  if (typeCount >= card.highlander_threshold)
    trainingBonus += card.highlander_training
  let fsBonus = 1
  let motivationBonus = card.mb
  if (rainbow) {
    fsBonus = card.fs_bonus * card.unique_fs_bonus
    motivationBonus += card.fs_motivation
    trainingBonus += card.fs_training
  }

  // Case 1: the candidate trains alone.
  let soloGain = [0, 0, 0, 0, 0, 0]
  for (let stat = 0; stat < STAT_COUNT; stat++) {
    if (gains[stat] === 0) continue

    let base = gains[stat] + card.stat_bonus[stat]
    if (rainbow) base += card.fs_stats[stat]
    soloGain[stat] +=
      base *
      trainingBonus *
      (1 + weights.motivation * motivationBonus) *
      fsBonus *
      (1 + CARD_BONUS) *
      weights.umaBonus[stat] -
      gains[stat]
  }
  if (GainsToScore(soloGain, weights) > weights.minimum) {
    for (let stat = 0; stat < STAT_COUNT; stat++) {
      trainingGains[stat] +=
        soloGain[stat] *
        days *
        CalculateCombinationChance([], otherCards, trainingType) *
        (rainbow ? weights.multi : 1)
    }
  }

  if (otherCards.length == 0) return trainingGains

  // Case 2: each non-empty subset of deck members joins the candidate. The
  // candidate's marginal contribution is (gain with it) − (gain without it).
  const combinations = GetCombinations(otherCards)
  for (let i = 0; i < combinations.length; i++) {
    const combination = combinations[i]
    let withoutCandidate = [0, 0, 0, 0, 0, 0]
    let withCandidate = [0, 0, 0, 0, 0, 0]

    // The candidate's own training bonus, plus its crowd bonus for this many
    // cards on the training.
    const selfTrainingBonus =
      trainingBonus + (combination.length + 1) * card.crowd_bonus
    const combinationTrainingBonus = comboTrainingBonus(combination, typeCount)
    const combinationFriendshipBonus = comboFriendshipBonus(
      combination,
      trainingType
    )
    const combinationMotivationBonus = comboMotivationBonus(combination)

    for (let stat = 0; stat < STAT_COUNT; stat++) {
      if (gains[stat] === 0) continue

      let base = gains[stat] + comboStatBonus(combination, stat)
      if (rainbow) base += card.fs_stats[stat]

      withoutCandidate[stat] +=
        base *
        combinationTrainingBonus *
        (1 + weights.motivation * combinationMotivationBonus) *
        combinationFriendshipBonus *
        (1 + CARD_BONUS * combination.length) *
        weights.umaBonus[stat]

      withCandidate[stat] +=
        (base + card.stat_bonus[stat]) *
        (combinationTrainingBonus + selfTrainingBonus - 1) *
        (1 +
          weights.motivation *
          (combinationMotivationBonus + motivationBonus - 1)) *
        (combinationFriendshipBonus * fsBonus) *
        (1 + CARD_BONUS * (combination.length + 1)) *
        weights.umaBonus[stat]
    }

    if (GainsToScore(withCandidate, weights) > weights.minimum) {
      const chance = CalculateCombinationChance(
        combination,
        otherCards,
        trainingType
      )
      for (let stat = 0; stat < STAT_COUNT; stat++) {
        trainingGains[stat] +=
          (withCandidate[stat] - withoutCandidate[stat]) *
          days *
          chance *
          (rainbow ? weights.multi : 1)
      }
    }
  }

  return trainingGains
}

// Gain from the candidate training off its specialty. Only the deck members
// on *their* specialty (statCards) can rainbow here, so the candidate's
// contribution counts only for combinations that include such a card.
function CalculateCrossTrainingGain(
  gains,
  weights,
  card,
  otherCards,
  trainingType,
  days,
  typeCount,
  bonded
) {
  let trainingGains = [0, 0, 0, 0, 0, 0, 0]
  let statCards = otherCards.filter((c) => c.cardType === trainingType)
  let trainingBonus = card.tb + card.fan_bonus * weights.fanBonus
  if (typeCount >= card.highlander_threshold)
    trainingBonus += card.highlander_training
  let fsBonus = 1
  if (card.group && bonded) {
    fsBonus += (card.fs_bonus + card.unique_fs_bonus - 1) / 5
  }

  const combinations = GetCombinations(otherCards)
  for (let i = 0; i < combinations.length; i++) {
    const combination = combinations[i]
    let withoutCandidate = [0, 0, 0, 0, 0, 0]
    let withCandidate = [0, 0, 0, 0, 0, 0]

    // The candidate's own training bonus, plus its crowd bonus for this many
    // cards on the training.
    const selfTrainingBonus =
      trainingBonus + (combination.length + 1) * card.crowd_bonus
    const combinationTrainingBonus = comboTrainingBonus(combination, typeCount)
    const combinationFriendshipBonus = comboFriendshipBonus(
      combination,
      trainingType
    )
    const combinationMotivationBonus = comboMotivationBonus(combination)

    for (let stat = 0; stat < STAT_COUNT; stat++) {
      if (gains[stat] === 0) continue
      // Skip unless a rainbowing deck member is actually in this combination.
      if (!combination.some((r) => statCards.indexOf(r) > -1)) continue

      const base = gains[stat] + comboStatBonus(combination, stat)

      withoutCandidate[stat] +=
        base *
        combinationTrainingBonus *
        (1 + weights.motivation * combinationMotivationBonus) *
        combinationFriendshipBonus *
        (1 + CARD_BONUS * combination.length) *
        weights.umaBonus[stat]

      if (bonded) {
        withCandidate[stat] +=
          (base + card.stat_bonus[stat] + card.fs_stats[stat]) *
          (combinationTrainingBonus +
            selfTrainingBonus +
            card.fs_training -
            1) *
          (1 +
            weights.motivation *
            (combinationMotivationBonus + card.mb + card.fs_motivation - 1)) *
          (combinationFriendshipBonus * fsBonus) *
          (1 + CARD_BONUS * (combination.length + 1)) *
          weights.umaBonus[stat]
      } else {
        withCandidate[stat] +=
          (base + card.stat_bonus[stat]) *
          (combinationTrainingBonus + selfTrainingBonus - 1) *
          (1 +
            weights.motivation * (combinationMotivationBonus + card.mb - 1)) *
          (1 + CARD_BONUS * (combination.length + 1)) *
          weights.umaBonus[stat]
      }
    }

    if (GainsToScore(withCandidate, weights) > weights.minimum) {
      const chance = CalculateCombinationChance(
        combination,
        otherCards,
        trainingType
      )
      for (let stat = 0; stat < STAT_COUNT; stat++) {
        trainingGains[stat] +=
          (withCandidate[stat] - withoutCandidate[stat]) *
          days *
          chance *
          weights.multi
      }
    }
  }

  return trainingGains
}

// Weighted sum of stat gains, each capped at weights.cap.
function GainsToScore(gains, weights) {
  let score = 0
  for (let stat = 0; stat < STAT_COUNT; stat++) {
    score += Math.min(gains[stat], weights.cap) * weights.stats[stat]
  }
  return score
}

// Every subset of `cards` with at least `minLength` members (built by treating
// the bits of each number 0..2^n-1 as a membership mask).
function GetCombinations(cards, minLength = 1) {
  let combinations = []
  const count = Math.pow(2, cards.length)

  for (let mask = 0; mask < count; mask++) {
    let subset = []
    for (let j = 0; j < cards.length; j++) {
      if (mask & Math.pow(2, j)) subset.push(cards[j])
    }
    if (subset.length >= minLength) combinations.push(subset)
  }

  return combinations
}

// Probability that exactly `combination` lands on `trainingType` this turn:
// the combination members do, and (when `cards` is given) none of the rest do.
function CalculateCombinationChance(combination, cards, trainingType) {
  const landsOn = (card) =>
    card.cardType === trainingType ? card.rainbowSpecialty : card.offSpecialty

  let chance = combination.reduce((current, card) => current * landsOn(card), 1)

  if (cards) {
    const otherCards = cards.filter(
      (c) => combination.findIndex((d) => c.index == d.index) === -1
    )
    chance = otherCards.reduce(
      (current, card) => current * (1 - landsOn(card)),
      chance
    )
  }

  return chance
}

  const api = { processCards, GainsToScore, getScenario, getServerConfig, SCENARIOS_BY_SERVER, events, raceRewards };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Euophrys = api;
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : globalThis);
