import $ from 'jquery';
import '../../../lib/select2';
import '../../../utils/velocity';
import app from '../../../app';
import { getTranslatedCountries } from '../../../data/countries';
import loadTemplate from '../../../utils/loadTemplate';
import BaseModal from '../BaseModal';
import Order from '../../../models/Order';
import PopInMessage from '../../PopInMessage';
import Moderators from './moderators';

export default class extends BaseModal {
  constructor(options = {}) {
    if (!options.listing) {
      throw new Error('Please provide a listing object');
    }

    if (!options.vendor) {
      throw new Error('Please provide a vendor object');
    }

    super(options);
    this.options = options;
    this.listing = options.listing;
    this.variants = options.variants;
    this.vendor = options.vendor;
    this.order = new Order({
      items: [{
        listingHash: this.listing.listingHash,
        quantity: 1,
      }],
    });

    const fetchErrorTitle = app.polyglot.t('purchase.errors.moderatorsTitle');
    const fetchErrorMsg = app.polyglot.t('purchase.errors.moderatorsMsg');


    this.moderators = new Moderators({
      moderatorIDs: this.listing.moderators || [],
      fetchErrorTitle,
      fetchErrorMsg,
      purchase: true,
      cardState: 'unselected',
      notSelected: 'unselected',
      singleSelect: true,
      selectFirst: true,
    });

    this.listenTo(this.moderators, 'changeModerator', ((data) => this.changeModerator(data)));

    this.countryData = getTranslatedCountries(app.settings.get('language'))
        .map(countryObj => ({ id: countryObj.dataName, text: countryObj.name }));

    this.listenTo(app.settings.get('shippingAddresses'), 'update',
        (cl, updateOpts) => {
          if (updateOpts.changes.added.length ||
              updateOpts.changes.removed.length) {
            // update the shipping section with the changed address information
          }
        });

    this.listenTo(app.settings, 'change:localCurrency', () => this.showDataChangedMessage());
    this.listenTo(app.localSettings, 'change:bitcoinUnit', () => this.showDataChangedMessage());
  }

  className() {
    return `${super.className()} purchase modalScrollPage`;
  }

  events() {
    return {
      'click #purchaseModerated': 'clickModerated',
      'click .js-payBtn': 'clickPayBtn',
      'click .js-pendingBtn': 'clickPendingBtn',
      ...super.events(),
    };
  }

  showDataChangedMessage() {
    if (this.dataChangePopIn && !this.dataChangePopIn.isRemoved()) {
      this.dataChangePopIn.$el.velocity('callout.shake', { duration: 500 });
    } else {
      const refreshLink =
        `<a class="js-refresh">${app.polyglot.t('purchase.refreshPurchase')}</a>`;

      this.dataChangePopIn = this.createChild(PopInMessage, {
        messageText: app.polyglot.t('listingDetail.listingDataChangedPopin',
            { refreshLink }),
      });

      this.listenTo(this.dataChangePopIn, 'clickRefresh', () => (this.render()));

      this.listenTo(this.dataChangePopIn, 'clickDismiss', () => {
        this.dataChangePopIn.remove();
        this.dataChangePopIn = null;
      });

      this.$popInMessages.append(this.dataChangePopIn.render().el);
    }
  }

  clickModerated(e) {
    const checked = $(e.target).attr('checked');
    this.$moderatorSection.toggleClass('hide', checked);
  }

  changeModerator(data) {
    this.order.set({ moderator: data.guid });
  }

  clickPayBtn() {
    // if the moderator checkbox was deselected, remove the moderator
    if (!this.$('#purchaseModerated').attr('checked')) {
      this.order.set({ moderator: '' });
    }
  }

  clickPendingBtn() {

  }

  get $popInMessages() {
    return this._$popInMessages ||
        (this._$popInMessages = this.$('.js-popInMessages'));
  }

  get $storeOwnerAvatar() {
    return this._$storeOwnerAvatar ||
        (this._$storeOwnerAvatar = this.$('.js-storeOwnerAvatar'));
  }

  get $moderatorSection() {
    return this._$moderatorSection ||
        (this._$moderatorSection = this.$('.js-moderator'));
  }

  get $payBtn() {
    return this._$payBtn ||
        (this._$payBtn = this.$('.js-payBtn'));
  }

  get $pendingBtn() {
    return this._$pendingBtn ||
        (this._$pendingBtn = this.$('.js-pendingBtn'));
  }

  get $closeBtn() {
    return this._$closeBtn ||
        (this._$closeBtn = this.$('.js-closeBtn'));
  }

  remove() {
    super.remove();
  }

  render() {
    if (this.dataChangePopIn) this.dataChangePopIn.remove();

    loadTemplate('modals/purchase/purchase.html', t => {
      this.$el.html(t({
        listing: this.listing,
        vendor: this.vendor,
        variants: this.variants,
        displayCurrency: app.settings.get('localCurrency'),
        countryData: this.countryData,
        defaultCountry: this.defaultCountry,
      }));

      super.render();

      this._$popInMessages = null;
      this._$storeOwnerAvatar = null;
      this._$moderatorSection = null;
      this._$payBtn = null;
      this._$pendingBtn = null;
      this._$closeBtn = null;

      // add the moderators section content
      this.$('.js-moderatorsWrapper').append(this.moderators.render().el);
      this.moderators.getModeratorsByID();
    });

    return this;
  }
}
