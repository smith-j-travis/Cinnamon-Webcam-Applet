const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

class WidgetStatusApplet extends Applet.TextIconApplet {
    updateIcon() {
      let firstVideoDevice = backtick("ls -1 /dev").split("\n").find(function(device) {
        return device.toLowerCase().indexOf("video") > -1;
      });

      this.camProcess = backtick("fuser /dev/" + firstVideoDevice).trim();

      if(this.camProcess == "") {
        this.set_applet_icon_name("webcam-off");
        this.set_applet_tooltip(_("Webcam is currently off"));
      } else {
        this.set_applet_icon_name("webcam-on");
        this.set_applet_tooltip(_("Webcam is currently on"));
      }

      if(this.running === true) {
        setTimeout(this.updateIcon, 2000);
      }
    }

    constructor(orientation, panel_height, instance_id) {
        super(orientation, panel_height, instance_id);
        
        this.updateIcon = this.updateIcon.bind(this);
        this.running = true;
        this.camProcess = "";

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);
        this._contentSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._contentSection);

        let item = new PopupMenu.PopupIconMenuItem(_("Kill Webcam Process"), "window-close-symbolic", St.IconType.SYMBOLIC);
        item.connect('activate', Lang.bind(this, function() {
          GLib.spawn_command_line_sync("kill " + this.camProcess);
        }));
        this.menu.addMenuItem(item);

        this.updateIcon();
    }

    on_applet_clicked(event) {
      if(this.camProcess != "") {
        this.menu.toggle();
      }
    }

    on_applet_removed_from_panel() {
      this.running = false;
    }
}

function backtick(command) {
    try {
      let [result, stdout, stderr] = GLib.spawn_command_line_sync(command);
      if (stdout != null) {
        return stdout.toString();
      }
    }
    catch (e) {
      global.logError(e);
    }
  
    return "";
  }

function main(metadata, orientation, panel_height, instance_id) {
    return new WidgetStatusApplet(orientation, panel_height, instance_id);
}
