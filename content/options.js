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

Components.utils.import('resource://siphon/modules/console.js')

var SiphonSettings = {

	init: function() {
		this.draw()
	},

	draw: function() {
		document.getElementById( "last-sync" ).setAttribute( "value", Siphon.prefs.getCharPref( "last_sync" ) || "Not synced yet." )
		var hostname = Siphon.hostname()
		document.getElementById( "server-settings-label" ).setAttribute( "value", hostname )
		document.getElementById( "server-settings-label" ).setAttribute( "href", hostname )
		document.getElementById( "server-settings-secure-label" ).setAttribute( "value",
		  Siphon.prefs.getBoolPref( "encryption_enabled" ) ? '(Secure)' : '' )
		document.getElementById( "l-password" ).value = Siphon._login_info.password
		//this.updateStatus()
	},

	redraw: function() {
		this.draw()
	},

	setLogginFailedUI: function() {
		//this.alertSyncStatus("Login Failed")
	},

	setSignUpSucceededUI: function() {
		this.clearSignUpUI()
		this.setSignedUpUI()
		//this.alertSignupStatus("Signup Successed")
	},

	setSignUpFailedUI: function() {
		this.setSignedUpUI()
		//this.alertSignupStatus("Signup Failed")
	},

	/*setSignUpableUI: function() {
		document.getElementById("sign-up-btn").disabled = false
	},

	setUnsignUpableUI: function() {
		document.getElementById("sign-up-btn").disabled = true
	},*/

	setSigningUpUI: function() {
		document.getElementById("throbber-sign-up").style.display = "block"
		document.getElementById("s-email").disabled =
		document.getElementById("s-password").disabled =
		document.getElementById("r-password").disabled = true
	},

	setSignedUpUI: function() {
		document.getElementById("throbber-sign-up").style.display = "none"
		document.getElementById("s-email").disabled =
		document.getElementById("s-password").disabled =
		document.getElementById("r-password").disabled = false

		/*if (this.validateSignUpText())
			this.setSignUpableUI()
		else
			this.setUnsignUpableUI()*/
	},

	disableMainButtons: function() {
		document.getElementById("sync-btn").disabled =
		document.getElementById("show-sign-up-btn").disabled =
		document.getElementById("forgot-btn").disabled = true
	},

	enableMainButtons: function() {
		document.getElementById("sync-btn").disabled =
		document.getElementById("show-sign-up-btn").disabled =
		document.getElementById("forgot-btn").disabled = false
	},

	clearSignUpUI: function() {
		document.getElementById("s-email").value = ""
		document.getElementById("s-password").value = ""
		document.getElementById("r-password").value = ""
	},

	alertSyncStatus: function(message) {
		this.alertStatus(message)
	},

	alertSignupStatus: function(message) {
		this.alertStatus(message)
	},

	alertStatus: function(message) {
		document.getElementById("alert-status").setAttribute("value", message)
		setTimeout(function() {
			document.getElementById("alert-status").setAttribute("value", "")
		}, 1500);
	},

	setStatus: function(message) {
		document.getElementById("alert-status").setAttribute("value", message)
	},

	validateLogInText: function() {
		if (document.getElementById("l-email").value.match(/^..*@..*\...*$/)
		 && document.getElementById("l-password").value )
			return true
		return false
	},

	validateSignUpText: function() {
		var n_valid = 0;

		if (document.getElementById("s-password").value) {
			n_valid++
			document.getElementById("s-password-validate").className = 'valid'
		} else
			document.getElementById("s-password-validate").className = 'invalid'

		if (document.getElementById("r-password").value
		 && document.getElementById("s-password").value
		 == document.getElementById("r-password").value) {
			n_valid++
			document.getElementById("r-password-validate").className = 'valid'
		} else
			document.getElementById("r-password-validate").className = 'invalid'

		if ( document.getElementById("s-email").value.match(/^..*@..*\...*$/) ) {
			n_valid++
			document.getElementById("s-email-validate").className = 'valid'
		} else
			document.getElementById("s-email-validate").className = 'invalid'

		return n_valid == 3 ? true : false
	},

	validateSignUpInfo: function(onSuccess, onFail) {
		Siphon.signup(
			document.getElementById("s-email").value, document.getElementById("s-password").value,
			onSuccess, onFail
		)
	},

	/*updateStatus: function() {
		if ( Siphon.invalid_account ) {
			document.getElementById( "status-uninstalled-icon" ).className = "icon-alert"
			document.getElementById( "status-uninstalled-label" ).value = "Account invalid. Please login or sign up."
		} else if ( Siphon.nUninstalledAddons() ) {
			document.getElementById( "status-uninstalled-icon" ).className = "icon-alert"
			document.getElementById( "status-uninstalled-label" ).value =
			  Siphon.nUninstalledAddons() +
			  " addon" + ( Siphon.nUninstalledAddons() != 1 ? "s" : "" ) +
			  " need" + ( Siphon.nUninstalledAddons() != 1 ? "" : "s" ) +
			  " to be installed."
		} else {
			document.getElementById( "status-uninstalled-icon" ).className = "icon-success"
			document.getElementById( "status-uninstalled-label" ).value = "No addons need to be installed!"
		}

		document.getElementById( "status-installed-label" ).value =
		  Siphon.em.getItemList( 2, [] ).length +
		  " addon" + ( Siphon.em.getItemList( 2, [] ).length != 1 ? "s" : "" ) +
		  " installed, " +
		  Siphon.ignored_addons.length + 
		  " addon" + ( Siphon.ignored_addons.length != 1 ? "s" : "" ) +
		  " ignored."
	},*/

	/*openSignup: function() {
		document.getElementById( "login-vbox" ).style.display = "none"
		document.getElementById( "signup-vbox" ).style.display = "block"
	},

	closeSignup: function() {
		document.getElementById( "login-vbox" ).style.display = "block"
		document.getElementById( "signup-vbox" ).style.display = "none"
	},*/

	onForgotCommand: function( btn ) {
		this.updateSettingsFromUI()
		var $this = this
		var orig_value = btn.getAttribute( 'label' )

		btn.setAttribute( 'label', 'Sending Request' )
		btn.setAttribute( 'disabled', 'true' )

		var callback = function() {
			btn.setAttribute( 'label', orig_value )
			btn.setAttribute( 'disabled', 'false' )
		}
		Siphon.onForgotCommand( callback, callback )
	},

	onDeleteAccountCommand: function( btn ) {
		this.updateSettingsFromUI()
		var $this = this
		var orig_value = btn.getAttribute( 'label' )

		btn.setAttribute( 'label', 'Sending Request' )
		btn.setAttribute( 'disabled', 'true' )

		var callback = function() {
			btn.setAttribute( 'label', orig_value )
			btn.setAttribute( 'disabled', 'false' )
		}
		Siphon.onDeleteCommand( function() {
			document.getElementById('l-password').value = ''
			callback()
		}, callback )
	},

	onSignUpChange: function() {
		this.validateSignUpText()
		/*if (this.validateSignUpText())
			this.setSignUpableUI()
		else
			this.setUnsignUpableUI()*/
	},

	onSignUpCommand: function() {
		if ( !this.validateSignUpText() ) return
		try {
			this.setSigningUpUI()
			this.validateSignUpInfo(
				function(){
					SiphonSettings.onSignUpSucceeded();
				//	SiphonSettings.setSignUpSucceededUI();
				},
				function(){SiphonSettings.setSignUpFailedUI();}
			)
		} catch(e) {
			alert(e)
		}
	},

	onSignUpStopCommand: function() {
		this.setSignedUpUI()
		Siphon.abortSignup()
	},

	onSignUpSucceeded: function() {
		try {
		//Siphon.resetPrefs()
		//Siphon.unsetFirstRun()
		//	Siphon._email = false
		Siphon.prefs.setCharPref( "email", document.getElementById("s-email").value )
		Siphon.setLoginInfo( document.getElementById("s-password").value )
			Siphon.optionsWindow().SiphonSettings.onSyncCommand()
		//this.setSignUpSucceededUI()

		} catch ( e ) { alert( e ) }
	},

	updateSettingsFromUI: function() {
		Siphon.prefs.setCharPref( "email", document.getElementById("l-email").value )
		Siphon.prefs.setBoolPref( "hide_status_bar", document.getElementById("hide-status-bar-cb").checked )
		Siphon.prefs.setBoolPref( "enable_recommended", document.getElementById("enable-recommended-bar-cb").checked )
		Siphon.setLoginInfo( document.getElementById("l-password").value )
	},

	onSyncCommand: function() {
		this.updateSettingsFromUI()
		document.documentElement.showPane( document.getElementById( 'pane-installer' ) )
		SiphonInstaller.onSyncCommand()
	},

	onServerConfigureCommand: function() {
		var features = "chrome,titlebar,centerscreen,resizable"
		var win = window.openDialog( "chrome://siphon/content/server-configuration.xul", "Siphon Server Configuration", features )
		win.addEventListener( "unload", function() {
			Siphon.findLoginInfo()
			SiphonSettings.redraw()
		}, false )
	},

	onCreateAccountCommand: function() {
		var features = "chrome,titlebar,centerscreen,resizable"
		this.signup_win = window.openDialog( "chrome://siphon/content/create-account.xul", "Create a Siphon Account", features )
		this.signup_win.addEventListener( "unload", function() {
			Siphon.findLoginInfo()
			SiphonSettings.redraw()
		}, false )
	}
}

var SiphonInstaller = {

	installing: {},

	install_btns: [],

	init: function() {
		this.draw()
	},

	draw: function() {
		var found = false
		var sorted_addons = [ [], [], [], [], [], [] ]
		var used_addons = {}

		if ( Siphon.prefs.getBoolPref('enable_recommended') )
			for ( var guid in Siphon.recommended ) {
				sorted_addons[ 5 ].push( guid )
				console.write( "Recommend: " + guid )
				break
			}

		for ( var i = 0; i < Siphon.new_addons.length; i++ ) {
			sorted_addons[ 4 ].push( Siphon.new_addons[i] )
			used_addons[ Siphon.new_addons[i] ] = true
		}

		for ( var guid in Siphon.addon_status ) {
			if ( !used_addons[ guid ] ) {
				sorted_addons[ Siphon.addon_status[guid] - 1 ].push( guid )
			}
			found = true
		}

		if ( found ) {
			Siphon.new_addons = []
			this.clear()
		}

	//	var spacer = document.createElement( 'spacer' )
	//	spacer.setAttribute( "flex", "1")
		for ( var i = sorted_addons.length - 1; i >= 0; i-- ) {
			for ( var j = 0; j < sorted_addons[i].length; j++ ) {
				var guid = sorted_addons[i][j]

				document.getElementById('siphon_addon_listbox').appendChild(
					this.createAddonListitem(
						//Siphon.uninstalled_addons[ i ].version,
						i != 5 ? Siphon.addons[guid] : Siphon.recommended[guid],
						i
					)
				)
			}
		}
	//	document.getElementById('siphon_addon_listbox').appendChild( spacer )
	},

	clear: function() {
		while ( document.getElementById( 'siphon_addon_listbox' ).hasChildNodes() )
			document.getElementById( 'siphon_addon_listbox' ).removeChild( document.getElementById( 'siphon_addon_listbox' ).childNodes[ 0 ] )
		this.install_btns = []
	},

	redraw: function() {
		this.clear()
		this.draw()
	},

	createAddonListitem: function( addon_info, type ) {
		console.write( "addon_info: " + addon_info )
		var guid = addon_info.id

		var list_item = document.createElement( 'richlistitem' )
		list_item.setAttribute( "align", "center" )
		list_item.setAttribute( "id", guid )
		if ( type == 4 ) {
			list_item.setAttribute( "class", "new_addon" )
			list_item.addEventListener( "click", function() {
				list_item.setAttribute( "class", "" )
			}, false )
		}

		if ( type == 5 ) {
			list_item.setAttribute( "class", "recommended_addon" )
		}

		var icon = document.createElement( "image" )
		icon.setAttribute( "src", addon_info.iconURL || "chrome://mozapps/skin/xpinstall/xpinstallItemGeneric.png" )
		list_item.appendChild( icon )

		var name_box = document.createElement( "box" )
		name_box.setAttribute( "style", "overflow:hidden; width: 210px; white-space: nowrap" )
		list_item.appendChild( name_box )

		var addon_name = document.createElement( 'label' )
		addon_name.setAttribute( "class", "addon_name" )
		addon_name.setAttribute( "value", addon_info.name )

		if ( addon_info.link ) {
			addon_name.setAttribute( "href", addon_info.link )
			addon_name.setAttribute( "class", "addon_name text-link" )
		}

		name_box.appendChild( addon_name )


		//var version_box = document.createElement( "box" )
		//version_box.setAttribute( "style", "overflow:hidden; width: 40px; white-space: nowrap" )
		//list_item.appendChild( version_box )

		//var addon_version = document.createElement( 'label' )
		//addon_version.setAttribute( "value", version )
		//version_box.appendChild( addon_version )

		var spacer = document.createElement( 'spacer' )
		spacer.setAttribute( "flex", "1" )
		list_item.appendChild( spacer )

		if ( type == 5 ) {
			var recommended = document.createElement( 'label' )
			recommended.setAttribute( "class", "recommended" )
			recommended.setAttribute( "value", "Recommended" )
			list_item.appendChild( recommended )
		}

		var throbber = document.createElement( 'image' )
		throbber.style.visibility = 'hidden'
		throbber.setAttribute( 'src', "chrome://siphon/content/throbber/throbber.png" )
		list_item.appendChild( throbber )

		var onChecked = function() {
			if ( checkbox.getAttribute( "checked" ) ) {
				if ( Siphon.addon_status[ guid ] == Siphon.STAT_NOT_INSTALLED ) {
					install_btn.setAttribute( "disabled", "true" )
					Siphon.ignoreAddon( guid )
				} else if ( Siphon.addon_status[ guid ] == Siphon.STAT_INSTALLED_NO_SYNC )
					Siphon.syncAddon( guid )
			} else {
				if ( Siphon.addon_status[ guid ] == Siphon.STAT_NOT_INSTALLED_IGNORED ) {
					Siphon.unignoreAddon( guid )
					install_btn.setAttribute( "disabled", "false" )
				} else if ( Siphon.addon_status[ guid ] == Siphon.STAT_INSTALLED )
					Siphon.unsyncAddon( guid )
			}
			//SiphonSettings.updateStatus()
		}

		var checkbox = document.createElement( 'checkbox' )

		checkbox.addEventListener( "command", onChecked, false )

		if ( type != 5 )
			list_item.appendChild( checkbox )

		var install_btn = document.createElement( 'button' )
		if ( type != 5 )
			this.install_btns.push( install_btn )

		if ( Siphon.addon_status[ guid ] == Siphon.STAT_INSTALLED || Siphon.addon_status[ guid ] == Siphon.STAT_INSTALLED_NO_SYNC ) {
			install_btn.setAttribute( "label", "Installed" )
			install_btn.setAttribute( "disabled", "true" )
			checkbox.setAttribute( "label", "Sync" )
		} else {
			install_btn.setAttribute( "label", "Install" )
			checkbox.setAttribute( "label", "Ignore" )
		}
		//install_btn.setAttribute("disabled", "true")
		install_btn.addEventListener( "command", function( e ) {
			Siphon.onGetAddonCommand( guid )
			install_btn.setAttribute( "disabled", "true" )
			install_btn.setAttribute( "label", "Installing" )
			checkbox.setAttribute( "disabled", true )
			throbber.style.visibility = 'visible'
			SiphonSettings.setStatus('Loading info from mozilla.org...this might take a moment.')

			SiphonInstaller.installing[guid] = [
				function() {
					throbber.style.visibility = 'hidden'
					install_btn.setAttribute( "label", "Restart" )
				},
				function() {
					throbber.style.visibility = 'hidden'
					install_btn.setAttribute( "label", "Install" )
					install_btn.setAttribute( "disabled", "false" )
					checkbox.setAttribute( "disabled", false )
				}
			]
			//install_btn.setAttribute( "label", "restart" )
			//window.close()
		}, false )

		list_item.appendChild( install_btn )

		var delete_btn = document.createElement( 'button' )
		delete_btn.setAttribute( "label", "Delete" )
		delete_btn.addEventListener( "command", function( e ) {
			Siphon.deleteAddon( guid )
			throbber.style.visibility = 'visible'
			list_item.parentNode.removeChild( list_item )
		}, false )

		if ( type != 5 )
			list_item.appendChild( delete_btn )

		if ( Siphon.addon_status[ guid ] == Siphon.STAT_NOT_INSTALLED_IGNORED || Siphon.addon_status[ guid ] == Siphon.STAT_INSTALLED )
			checkbox.setAttribute( "checked", true )

		return list_item
	},

	onInstallAllCommand: function() {
		for ( var i = 0; i < this.install_btns.length; i++ ) {
			if ( this.install_btns[i].getAttribute( "disabled" ) != "true" )
				this.install_btns[i].click()
		}
	},

	onInstallWindowOpened: function( guid ) {
		SiphonSettings.alertStatus('Loaded information from mozilla.org.')
		if ( this.installing[guid] ) {
			try{
				this.installing[guid][0]()
				delete this.installing[guid]
			} catch (e) {
				alert(e)
			}
		}
	},

	onInstallFailed: function( guid ) {
		SiphonSettings.alertStatus('Could not locate add-on installer.')
		if ( this.installing[guid] ) {
			try{
				this.installing[guid][1]()
				delete this.installing[guid]
			} catch (e) {
				alert(e)
			}
		}
	},

	setSyncingUI: function() {
		document.getElementById("throbber").style.visibility = "visible"
		document.getElementById("sync-stop-btn").style.visibility = "visible"
		document.getElementById("sync-btn").setAttribute("disabled", true)
	},

	setSyncStoppedUI: function() {
		document.getElementById("throbber").style.visibility = "hidden"
		document.getElementById("sync-stop-btn").style.visibility = "hidden"
		document.getElementById("last-sync").setAttribute("value", Siphon.prefs.getCharPref("last_sync"))
		document.getElementById("sync-btn").setAttribute("disabled", false)
	},

	onSyncCommand: function() {
		console.write( 'onSyncCommand' )
		try {
			this.setSyncingUI()
			$this = this
			Siphon.synchronize(
				function(retval){$this.onSyncSucceeded(retval)},
				function(retval){$this.onSyncFailed(retval)}
			)
		} catch ( e ) { alert ( e ) }
	},

	onSyncStopCommand: function() {
		this.setSyncStoppedUI()
		Siphon.abortSync()
	},

	onSyncSucceeded: function( retval ) {
		this.setSyncStoppedUI()
		if ( SiphonSettings.signup_win ) {
			SiphonSettings.signup_win.close()
			delete SiphonSettings.signup_win
		}
	//	this.alertSyncStatus( "Synchronize Succeeded" )
	},

	onSyncFailed: function( retval ) {
		this.setSyncStoppedUI()
		//if ( retval == 0 )
		//	this.alertSyncStatus( "Login Failed" )
		//else
		//	this.alertSyncStatus( "Synchronize Failed" )
	}

}
