/*
 *
 *+   Copyright (c) 2009 Ian Halpern
 *@   http://siphon-fx.com
 *
 *    This file is part of Siphon.
 *
 *    Siphon is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU General Public License as published by
 *    the Free Software Foundation, either version 3 of the License, or
 *    (at your option) any later version.
 *
 *    Siphon is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU General Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License
 *    along with Siphon.  If not, see <http://www.gnu.org/licenses/>.
 */

var EXPORTED_SYMBOLS = [ "Siphon" ]

var options_window = false

var JSON = Components.classes["@mozilla.org/dom/json;1"].createInstance(Components.interfaces.nsIJSON)

var Siphon = {

	STAT_INSTALLED: 1,
	STAT_INSTALLED_NO_SYNC: 2,
	STAT_NOT_INSTALLED_IGNORED: 3,
	STAT_NOT_INSTALLED: 4,

	months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	transport: null,

	addons: null,
	addon_status: null,

	em: Components.classes[ "@mozilla.org/extensions/manager;1" ]
	  .getService( Components.interfaces.nsIExtensionManager ),

	prefs: Components.classes[ "@mozilla.org/preferences-service;1" ]
	  .getService( Components.interfaces.nsIPrefService ).getBranch( "extensions.siphon." ),

	locale: Components.classes[ "@mozilla.org/intl/nslocaleservice;1" ]
	  .getService( Components.interfaces.nsILocaleService ).getLocaleComponentForUserAgent(),

	app_ABI: Components.classes[ "@mozilla.org/xre/app-info;1" ]
	  .getService( Components.interfaces.nsIXULRuntime ).XPCOMABI,

	app_OS: Components.classes[ "@mozilla.org/xre/app-info;1" ]
	  .getService( Components.interfaces.nsIXULRuntime ).OS,

	app_id: Components.classes[ "@mozilla.org/xre/app-info;1" ]
	  .getService( Components.interfaces.nsIXULAppInfo ).ID,

	app_version: Components.classes[ "@mozilla.org/xre/app-info;1" ]
	  .getService( Components.interfaces.nsIXULAppInfo ).version,

	console: Components.classes["@mozilla.org/consoleservice;1"]
                                 .getService(Components.interfaces.nsIConsoleService),

	win: function() {
		return Components.classes[ '@mozilla.org/appshell/window-mediator;1' ]
		  .getService( Components.interfaces.nsIWindowMediator )
		  .getMostRecentWindow( 'navigator:browser' )
	},

	wins: function() {
		var wins = []
		var enumerator = Components.classes[ '@mozilla.org/appshell/window-mediator;1' ]
		  .getService( Components.interfaces.nsIWindowMediator )
		  .getEnumerator( 'navigator:browser' )
		while ( enumerator.hasMoreElements() ) {
			wins.push( enumerator.getNext() )
		}
		return wins
	},

	nUninstalledAddons: function() {
		var n = 0
		for ( var guid in this.addon_status )
			if ( this.addon_status[ guid ] == this.STAT_NOT_INSTALLED ) n++
		return n
	},

	// Events
	init: function() {

		this.addon_status = {}
		this.addons = {}
		this.new_addons = []

		this.synchronize()
		this.startPeriodicSynchronizer( 10 )

		if ( this.prefs.getBoolPref( 'first_run' ) ) {
			this.unsetFirstRun()
			this.openSettingsDialog( 'pane-settings' )
		}

	},

	apiURL: function() {
		return this.prefs.getCharPref( 'api_url' )
	},

	startPeriodicSynchronizer: function( minutes ) {
		var $this = this

		var event = { notify: function() {
			$this.synchronize()
		} }

		var timer = Components.classes[ "@mozilla.org/timer;1" ]
		  .createInstance( Components.interfaces.nsITimer )

		timer.initWithCallback(
			event,
			minutes * 60 * 1000,
			Components.interfaces.nsITimer.TYPE_REPEATING_SLACK
		)

	},

	onStatusBarItemCommand: function( event ) {
		switch ( event.button ) {
			case 0:
				if ( ! event.ctrlKey ) {
					this.openSettingsDialog()
					return
				}
			case 1: // middle button
				return
		}
	},

	onStatusBarMenuItemCommand: function( action ) {
		switch( action ) {
			case "sync":
				this.synchronize()
				break
			case "settings":
				this.openSettingsDialog()
				break
		}
	},

	onMenuItemCommand: function() {
	},

	onSettingsCommand: function() {
		this.openSettingsDialog()
	},

	onForgotCommand: function( onSuccess, onFail ) {
		this.call({ params: { type: "forgot" }, onSuccess: onSuccess, onFail: onFail })
	},

	onGetAddonCommand: function( guid ) {
		this.installAddon( guid )
	},

	// Actions

	installAddon: function( guid ) {
		var addon, $this = this

		addon = this.addons[ guid ]

		if ( !addon ) return

		var url = 'https://versioncheck.addons.mozilla.org/update/VersionCheck.php?'
			+ "reqVersion=1"
			+ "&id="            + addon.id
			+ "&version="       + addon.version
			+ "&maxAppVersion=" + addon.maxAppVersion
			+ "&status=userEnabled"
			+ "&appID="         + this.app_id
			+ "&appVersion="    + this.app_version
			+ "&appOS="         + this.app_OS
			+ "&appABI="        + this.app_ABI
			+ "&locale="        + this.locale

		this.console.logStringMessage( url )
		new this.Request( url ).start( function( rdf_xml ) {

			var start = rdf_xml.indexOf( '<em:updateLink>' )
			if ( start != -1 ) start += '<em:updateLink>'.length
			var end   = rdf_xml.indexOf( '</em:updateLink>' )
			var xpi_url = rdf_xml.substr( start, end-start )

			if ( start == -1 || end == -1 ) return// Error, mal-formatted RDF xml

			var win = Components.classes[ '@mozilla.org/appshell/window-mediator;1' ]
			  .getService( Components.interfaces.nsIWindowMediator )
			  .getMostRecentWindow( 'navigator:browser' )

			win.openUILinkIn( xpi_url, 'current' )

			$this.addon_status[ guid ] = $this.STAT_INSTALLED
			$this.prefs.setCharPref( 'addon_status', JSON.encode( $this.addon_status ) )
			$this._syncronize_set()
			$this.updateStatusbars()
		} )

	},

	ignoreAddon: function( guid ) {
		this.addon_status[ guid ] = this.STAT_NOT_INSTALLED_IGNORED
		this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
		this.updateStatusbars()
	},

	unignoreAddon: function( guid ) {
		this.addon_status[ guid ] = this.STAT_NOT_INSTALLED
		this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
		this.updateStatusbars()
	},

	syncAddon: function( guid ) {
		this.addon_status[ guid ] = this.STAT_INSTALLED
		this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
		this._syncronize_set()
		this.updateStatusbars()
	},

	unsyncAddon: function( guid ) {
		this.addon_status[ guid ] = this.STAT_INSTALLED_NO_SYNC
		this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
		this.updateStatusbars()
	},

	deleteAddon: function( guid ) {
		if ( this.addon_status[ guid ] == this.STAT_INSTALLED ) {
			try {
				this.em.uninstallItem( guid )
			} catch ( e ) {}
		}
		delete this.addon_status[ guid ]
		this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
		this._syncronize_set()
	},

	unsetFirstRun: function() {
		this.prefs.setBoolPref( "first_run", false )
	},

	resetPrefs: function() {
		var list = this.prefs.getChildList( "", [] )
		for ( var i = 0; i < list.length; i++ ) {
			try { this.prefs.clearUserPref( list[ i ] ) } catch( e ) {}
		}
	},

	/*updateInstalledList: function( list ) {
		this.uninstalled_addons = list
		this.prefs.setCharPref( "wait_list", this.uninstalled_addons.join( "," ) )

		for ( var i = 0; i < this.ignored_addons.length; i++ ) {
			var found = false
			for ( var j = 0; j < this.uninstalled_addons.length; j++ ) {
				if ( this.uninstalled_addons[ j ].id == this.ignored_addons[ i ] ) {
					found = true
					break
				}
			}
			if ( ! found ) this.ignored_addons.splice( i, 1 )
		}

		this.prefs.setCharPref( "ignore_list", this.ignored_addons.join( "," ) )

		return this.uninstalled_addons.length
	},*/

	signup: function( email, password, onSuccess, onFail ) {

		this.call({
			params: { type: "signup", email: email, password: password },
			onSuccess: onSuccess,
			onFail: onFail
		})

	},

	synchronize: function( onSuccess, onFail ) {

		this.new_addons = []
		this.call({
			params: { type: 'get' },

			onSuccess: function( json ) {

				if ( this.prefs.getCharPref( 'addon_status' ) )
					this.addon_status = JSON.decode( this.prefs.getCharPref( 'addon_status' ) )

				var installed_addons = this.em.getItemList( 2, [] )

				var addon_mode = {}
				for ( var i = 0; i < installed_addons.length; i++ ) {
					addon_mode[ installed_addons[ i ].id ] = 1
					this.addons[ installed_addons[ i ].id ] = installed_addons[ i ]
				}

				for ( var guid in this.addon_status ) {
					if ( !addon_mode[ guid ] ) addon_mode[ guid ] = 0

					if ( this.addon_status[ guid ] == this.STAT_NOT_INSTALLED_IGNORED || this.addon_status[ guid ] == this.STAT_NOT_INSTALLED )
						if ( !addon_mode[ guid ] ) addon_mode[ guid ] += 1
						else addon_mode[ guid ] -= 2
					addon_mode[ guid ] += 2

					if ( this.addon_status[ guid ] == this.STAT_INSTALLED_NO_SYNC )
						addon_mode[ guid ] += 4
				}

				var n = 0
				for ( var guid in json.addons ) {
					if ( this.addon_status[ guid ] != this.STAT_INSTALLED_NO_SYNC ) {
						this.addons[ guid ] = json.addons[ guid ]
						if ( !addon_mode[ guid ] ) addon_mode[ guid ] = 0
						addon_mode[ guid ] += 4
					}
					n++
				}
				this.console.logStringMessage("sync get: " + n )

				for ( var guid in addon_mode ) {
					this.console.logStringMessage( guid + ' ' + addon_mode[ guid ] )
					switch( addon_mode[ guid ] ) {
						case 1:
						case 5:
							this.addon_status[ guid ] = this.STAT_INSTALLED
							this.console.logStringMessage( guid + ' installed' )
							break
						case 2:
						case 6:
							this.em.uninstallItem( guid )
							delete this.addon_status[ guid ]
							this.console.logStringMessage( guid + ' deleted' )
							break
						case 4:
							if ( !this.addon_status[ guid ] ) this.new_addons.push( guid )
							this.addon_status[ guid ] = this.STAT_NOT_INSTALLED
							this.console.logStringMessage( guid + ' want install' )
							break
						case 7:
							this.console.logStringMessage( guid + ' already synced' )
							break
					}
				}

				this.prefs.setCharPref( 'addon_status', JSON.encode( this.addon_status ) )
				this._syncronize_set( onSuccess, onFail )

			},

			onFail: function( json ) {
				if ( onFail ) onFail.call( this, json.retval )
			}
		})
	},

	_syncronize_set: function( onSuccess, onFail ) {

		var data = {}

		for ( var guid in this.addon_status ) {
			if ( this.addon_status[ guid ] != this.STAT_INSTALLED_NO_SYNC )
				data[ guid ] = this.addons[guid]
		}

		this.call({
			params: { type: 'set' },
			data: data,

			onSuccess: function( json ) {
				this.prefs.setCharPref( 'last_sync', this.formattedDate() )
				if ( onSuccess ) onSuccess.call( this, json.retval )
				this.afterSync()
			},

			onFail: function( json ) {
				if ( onFail ) onFail.call( this, json.retval )
			}
		})
	},

	call: function( options ) {
	//params, data, onSuccess, onFail
		var $this = this

		return this.transport = new this.Request( this.apiURL(), this.objMerge( {
			type:     '',
			email:    this.prefs.getCharPref( 'email' ),
			password: this.prefs.getCharPref( 'password' ),
			version:  this.prefs.getCharPref( 'version' ),
			rand: new Date().getTime()
		}, options.params || {} ), options.data || {} ).start( function( json_str ) {

			$this.transport = null

			try {
				//var json = eval( "(" + json_str + ")" )
				var json = JSON.decode( json_str );

				if ( json && json.alert_message && options_window )
					options_window.alert( json.alert_message )

				if ( json && json.status_message && options_window ) {
					options_window.SiphonSettings.alertStatus( json.status_message )
				}
			} catch ( e ) {
				this.win().alert( "Siphon Error: " + e/* json_str */ )
			}

			if ( json && json.retval == 0 ) {
				options.onSuccess.call( $this, json )
			} else {
				options.onFail.call( $this, json || {} )
			}

		} )

	},

	abortUpdate: function() {
		this.transport.abort()
		this.transport = null
	},

	openSettingsDialog: function( pane_id ) {
		if ( ! options_window ) {
			var features = "chrome,titlebar,toolbar,centerscreen,resizable"
			options_window = this.win().open( "chrome://siphon/content/options.xul", "Siphon Preferences", features )
			if ( pane_id )
				options_window.addEventListener( "load", function( e ) {
					options_window.document.documentElement.showPane( options_window.document.getElementById( pane_id ) )
				}, false )
		} else {
			options_window.focus() //bringToFront
		}
	},

	settingsDialogClosed: function() {
		options_window = false
	},

	tryAndOpenInstallerWindow: function() {
		if ( options_window ) {
			options_window.SiphonInstaller.redraw()
			options_window.SiphonSettings.redraw()
		}
		if ( this.nUninstalledAddons() && this.new_addons.length ) {
			this.openSettingsDialog( "pane-installer" )
		}
	},

	afterSync: function() {
		this.updateStatusbars()
		this.tryAndOpenInstallerWindow()
	},

	updateStatusbars: function() {
		var wins = this.wins()

		for ( var i = 0; i < wins.length; i++ ) {
			wins[i].document.getElementById( "siphon-statusbar-num" ).value = this.nUninstalledAddons() || ""
			if ( this.nUninstalledAddons() )
				wins[i].document.getElementById( "siphon-statusbar-alert" ).style.display = "block"
			else
				wins[i].document.getElementById( "siphon-statusbar-alert" ).style.display = "none"
		}
	},

	objMerge: function( dest, src ) {
		for ( var key in src )
			dest[ key ] = src[ key ]
		return dest
	},

	formattedDate: function() {

		var _date    = new Date()
		var month   = this.months[ _date.getMonth() ]
		var day     = _date.getDate()
		var hours   = _date.getHours() > 12 ? _date.getHours() - 12 : _date.getHours()
		var minutes = "00" + _date.getMinutes()
		var daypart = _date.getHours()  >= 12 ? "pm" : "am"

		minutes = minutes.substr( minutes.length - 2 )

		return month + " " + day + ", " + hours + ":" + minutes + " " + daypart
	}

}

Siphon.Request = function( url, params, data ) {
	this._url = url
	this._callback = null
	this._channel = null
	this._params = params || {}
	this._data = data || {}
}

Siphon.Request.prototype = {

	start: function( callback ) {

		this._callback = callback

		// the IO service
		var ioService = Components.classes[ "@mozilla.org/network/io-service;1" ]
		  .getService( Components.interfaces.nsIIOService )

		this._channel = ioService.newChannelFromURI( ioService.newURI( this._url + this.encode( this._params ), null, null ) )

		// get an listener

		var inputStream = Components.classes[ "@mozilla.org/io/string-input-stream;1" ]
		  .createInstance( Components.interfaces.nsIStringInputStream )

		var data_str = JSON.encode( this._data )
		inputStream.setData( data_str, data_str.length )

		var uploadChannel = this._channel.QueryInterface( Components.interfaces.nsIUploadChannel )
		uploadChannel.setUploadStream( inputStream, "text/json", -1 )


		if ( this._channel instanceof Components.interfaces.nsIHttpChannel )
			this._channel.requestMethod = 'POST'

		// Create a stream loader for retrieving the response.
		var streamLoader = Components.classes[ "@mozilla.org/network/stream-loader;1" ]
		  .createInstance( Components.interfaces.nsIStreamLoader )

		try {
			// Before Firefox 3...
			streamLoader.init( this._channel, this, null )
		} catch ( e ) {
			// Firefox 3 style...
			streamLoader.init( this )
			this._channel.asyncOpen( streamLoader, null )
		}

		return

	},

	onStreamComplete: function( loader, ctxt, status, resultLength, result ) {

		if ( Components.isSuccessCode( status ) ) {
			try {
				status = this._channel.responseStatus || 200
			} catch ( e ) {
				this._callback( this._channel.responseStatus + ": Disable automatic proxy settings detection." )
				return
			}

			var converter = Components.classes[ "@mozilla.org/intl/scriptableunicodeconverter" ]
			  .createInstance(Components.interfaces.nsIScriptableUnicodeConverter)
			converter.charset = "utf-8"

			var msg = ""
			if (status == 200 || status == 201 || status == 204) {

				msg = converter.convertFromByteArray(result, resultLength)
				this._callback( msg )

			}

		}

	},

	encode: function( obj ) {
		var str = ""
		for ( var key in obj ) {
			if ( str ) str += "&"
			else str = '?'
			str += key + "=" + escape( obj[ key ] )
		}
		return str
	}
}

Siphon.init()
