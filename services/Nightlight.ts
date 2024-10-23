import Gio from 'gi://Gio?version=2.0';
import { bash, dependencies } from 'lib/utils';

if (!dependencies('gammastep')) App.quit();


const maxTemperature = 2000;
const minTemperature = 6500;
const temperaturePersistPath = '/tmp/ags/hyprpanel/nightlight_temp';

class Nightlight extends Service {
    static {
        Service.register(
            this,
            {},
            {
                'temperature-percentage': ['float', 'rw'],
                'enabled': ['boolean', 'rw'],
            },
        );
    }

    private gammastepProc?: Gio.Subprocess;
    private temperature: number = 4500;

    get enabled(): boolean {
        return this.gammastepProc != null;
    }

    set enabled(value) {
        if (value) {
            if (!this.enabled) {
                this.gammastepProc = Utils.subprocess(`gammastep -O ${this.temperature}`);
                this.changed('enabled');
                console.debug('(Nightlight) Gammastep started');
            }
        }
        else {
            this.gammastepProc?.force_exit();
            this.gammastepProc = undefined;
            this.changed('enabled');
            console.debug("(Nightlight) Gammastep killed");
        }
    }

    get temperature_percentage(): number {
        return 1 - (this.temperature-maxTemperature)/(minTemperature-maxTemperature);
    }

    set temperature_percentage(percent) {
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;

        const newTemp = Math.round((1-percent)*(minTemperature-maxTemperature) + maxTemperature);

        Utils.writeFile(newTemp.toString(), temperaturePersistPath).then(async () => {
            this.temperature = newTemp;
            this.changed('temperature-percentage');
            console.debug(`(Nightlight) Temperature changed to ${this.temperature} K`);
            await this.restartGammastep();
        });
    }

    private updateTemperature(temp: string) {
        let newTemp = parseInt(temp, 10);
        if (isNaN(newTemp)) return;
        if (newTemp > minTemperature) newTemp = minTemperature;
        if (newTemp < maxTemperature) newTemp = maxTemperature;
        this.temperature = newTemp;
        this.changed('temperature-percentage');
        console.debug(`(Nightlight) New gammastep temperature ${this.temperature} K read from ${temperaturePersistPath}`);
    }

    private async restartGammastep() {
        if (this.enabled) {
            this.gammastepProc?.force_exit();
            this.gammastepProc = Utils.subprocess(`gammastep -O ${this.temperature}`);
            console.debug('(Nightlight) Gammastep restarted');
        }
    }

    constructor() {
        super();

        Utils.readFileAsync(temperaturePersistPath).then(async (newTemp) => {
            this.updateTemperature(newTemp);
        }).catch(async () => {
            this.temperature = 4500;
        }).then(() => {
            Utils.execAsync('pgrep gammastep').then((result) => {
                const pid = parseInt(result, 10);
                if (!isNaN(pid)) {
                    Utils.exec(`kill ${pid}`);
                    this.gammastepProc = Utils.subprocess(`gammastep -O ${this.temperature}`);
                    console.debug("(Nightlight) Found instance of gammastep running, restarting on a new one");
                }
            }).catch(() => {
                console.debug("(Nightlight) No instance of gammastep found");
            });
        })


        // Utils.monitorFile(temperaturePersistPath, async (f) => {
        //     const v = await Utils.readFileAsync(f);
        //     this.updateTemperature(v);
        //     await this.restartGammastep();
        // });
    }
}

export default new Nightlight();

