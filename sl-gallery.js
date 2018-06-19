/**
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import { PolymerElement, html } from '@polymer/polymer/polymer-element.js';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer.js';

import './sl-gallery-image.js';
import './sl-gallery-slideshow.js';

/**
 * Silverlinkz Photo Gallery
 * A Polymer hash-route based photo gallery.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class SLGallery extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          overflow: hidden;

          --sl-gallery-columns: 4;
          --sl-gallery-gutter: 8px;
          --sl-gallery-item-height: 75%;
        }

        :host([hidden]) {
          display: none;
        }

        .image-grid {
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;

          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          flex-direction: row;

          -ms-flex-wrap: wrap;
          -webkit-flex-wrap: wrap;
          flex-wrap: wrap;

          padding-top: var(--sl-gallery-gutter, 0px);
          padding-left: var(--sl-gallery-gutter, 0px);
          box-sizing: border-box;

          /* @override, hide gutter around grid */
          padding: 0;
          margin: 0 calc(-1 * var(--sl-gallery-gutter, 0px))
                  calc(-1 * var(--sl-gallery-gutter, 0px)) 0;
        }
      </style>

      <div class="image-grid" on-click="_handleGridClicked">
        <slot></slot>
      </div>

      <!-- Workaround for not being able to set "prefix" without a binding -->
      <span style="display: none;">{{prefix}}</span>
    `;
  }

  static get is() { return 'sl-gallery'; }

  static get properties() {
    return {
      active: {
        type: Boolean,
        value: true,
        observer: '_activeChanged',
      },
      prefix: {
        type: String,
        value: 'i',
      },
      _activeIndex: {
        type: Number,
        value: null,
        observer: '_activeIndexChanged',
      },
      _images: {
        type: Array,
        observer: '_imagesChanged',
      },
    };
  }

  constructor() {
    super();

    // Create slideshow element, keep handle as this.slideshow
    this.slideshow = document.createElement('sl-gallery-slideshow');

    // Create reference to local scope in slideshow
    this.slideshow.gallery = this;

    // Hide slideshow before appending to prevent potential flash of content
    this.slideshow.hidden = true;

    // Append slideshow to root custom-element
    document.body.appendChild(this.slideshow);
  }

  connectedCallback() {
    super.connectedCallback();

    // Initialize hash route and listen for changes
    this._updateRoute = this._updateRoute.bind(this);
    window.addEventListener('hashchange', this._updateRoute);
    this._updateRoute();

    // Create observer to watch for new nodes added from light dom
    this._observer = new FlattenedNodesObserver(this, (info) => {
      this._images = [...info.target.children];
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove listeners
    window.removeEventListener('hashchange', this._updateRoute);

    // Disconnect flattened nodes observer
    this._observer.disconnect();
  }

  _updateRoute() {
    const hash = window.location.hash;
    let routeIndex = null;

    if (hash && hash.substr(1, 1) === '/') {
      const [, prefix, rawIndex] = hash.split('/');
      if (prefix && prefix === this.prefix) {
        const index = parseInt(rawIndex);
        if (!isNaN(index)) {
          routeIndex = index;
        }
      }
    }

    this._activeIndex = routeIndex;
  }

  _resetRoute() {
    window.history.pushState(null, document.title,
        window.location.pathname + window.location.search);
    this._updateRoute();
  }

  _handleGridClicked(event) {
    if (event.target.index !== undefined) {
      window.location.hash = `/${this.prefix}/${event.target.index}`;
    }
  }

  _imagesChanged(images) {
    // Give each image an index based on position in array
    images.forEach((image, i) => {
      image.index = i;
    });

    // Manually call index changed when images change to update routes
    // [TODO]: Refactor so this is no longer necessary
    this._activeIndexChanged(this._activeIndex);
  }

  _activeChanged(active) {
    // Reflect active state to slideshow
    this.slideshow.active = active;
  }

  _activeIndexChanged(index) {
    // [TODO]: Should reflect state to slideshow and handle view from slideshow.active
    if (index !== null && this._images && this._images[index]) {
      this.slideshow.activeImage = this._images[index];
    } else {
      this.slideshow.activeImage = undefined;
    }
  }
}

window.customElements.define(SLGallery.is, SLGallery);
