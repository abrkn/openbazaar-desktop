import BaseModel from './BaseModel';

export default class extends BaseModel {
  defaults() {
    return {
      saveTransactionMetadata: true,
      defaultFee : 'high',
    };
  }
}
