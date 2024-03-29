const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

function WidgetStatusApplet(orientation, panel_height, instance_id) {
    this._init(orientation, panel_height, instance_id);
}

WidgetStatusApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panel_height, instance_id) {
            Applet.IconApplet.prototype._init.call(this, orientation, panel_height, instance_id);

            this.camProcess = "";
            this.menuManager = new PopupMenu.PopupMenuManager(this);
            this.menu = new Applet.AppletPopupMenu(this, orientation);
            this.menuManager.addMenu(this.menu);
            this._contentSection = new PopupMenu.PopupMenuSection();
            this.menu.addMenuItem(this._contentSection);

            let item = new PopupMenu.PopupIconMenuItem(_("Kill Webcam Process"), "window-close-symbolic", St.IconType.SYMBOLIC);

            item.connect('activate', Lang.bind(this, function() {
              try {
                GLib.spawn_command_line_async("kill " + this.camProcess);
              } catch(e) {
                global.logError(e);
              }
            }));

            this.menu.addMenuItem(item);

            this._updateLoopID = Mainloop.timeout_add(2000, () => this.updateIcon());
    },
    backtick: function(command) {
        try {
          let [result, stdout, stderr] = GLib.spawn_command_line_async(command);
          if (stdout != null) {
            return stdout.toString();
          }
        }
        catch (e) {
          global.logError(e);
        }

        return "";
   },

    updateIcon: function() {
      let firstVideoDevice = this.backtick("ls -1 /dev").split("\n").find(function(device) {
        return device.toLowerCase().indexOf("video") > -1;
      });

      this.camProcess = this.backtick("fuser /dev/" + firstVideoDevice).trim();

      if(this.camProcess == "") {
        this.set_applet_icon_name("webcam-off");
        this.set_applet_tooltip(_("Webcam is currently off"));
      } else {
        this.set_applet_icon_name("webcam-on");
        this.set_applet_tooltip(_("Webcam is currently on"));
      }

      this._updateLoopID = Mainloop.timeout_add(2000, () => this.updateIcon());
    },    

    on_applet_clicked: function() {
      if(this.camProcess != "") {
        this.menu.toggle();
      }
    },

    on_applet_removed_from_panel: function() {
        if(this._updateLoopID) {
            Mainloop.source_remove(this._updateLoopID);
        }
    }
};

function main(metadata, orientation, panel_height, instance_id) {
    return new WidgetStatusApplet(orientation, panel_height, instance_id);
}
