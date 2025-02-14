import { isHexString, toBuffer as utilsToBuffer } from 'ethereumjs-utils';

const toBuffer = v => {
  if (isHexString(v)) {
    return utilsToBuffer(v);
  }
  return Buffer.from(v);
};
export default toBuffer;
