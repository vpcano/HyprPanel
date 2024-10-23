import icons from "lib/icons";
import { BoxWidget } from "lib/types/widget";
import nightlight from '../../../../services/Nightlight.js';

const Nightlight = (): BoxWidget => {

    let slider_value = Variable(nightlight.temperature_percentage);
    nightlight.connect('notify::temperature-percentage', () => {
        slider_value.value = nightlight.temperature_percentage;
    });

    /**
     * This is done instead of using Widget.Slider directly because the onChange
     * event is triggered every time the slider changes its value, triggering the
     * restart of Gammastep and producing an ugly glitch. Instead, the temperature
     * will change only when the user ends drawing.
     * 
     * @returns 
     */
    function CustomSlider() {
        const onDragEnd = () => {
            nightlight.temperature_percentage = slider_value.value;
        };

        // Used to prevent scrolling
        let scrolling = false;

        return Widget.Slider({
            vpack: 'center',
            vexpand: true,
            value: slider_value.bind(),
            class_name: 'menu-active-slider menu-slider nightlight',
            cursor: 'pointer',
            draw_value: false,
            hexpand: true,
            min: 0,
            max: 1,
            onChange: (self) => {
                if (scrolling) {
                    scrolling = false;
                }
                else {
                    slider_value.value = self.value;
                }
            }
        })
        .on('button-release-event', onDragEnd)
        .on('key-release-event', onDragEnd)
        .on('scroll-event', (self) => {
            scrolling = true;
            // Restore value to prevent scrolling
            self.value = slider_value.value;
        });
    }


    return Widget.Box({
        class_name: 'menu-section-container nightlight',
        vertical: true,
        children: [
            Widget.Box({
                class_name: 'menu-label-container',
                hpack: 'fill',
                children: [
                    Widget.Label({
                        class_name: 'menu-label',
                        hexpand: true,
                        hpack: 'start',
                        label: 'Night Light',
                    }),
                    Widget.Box({
                        class_name: 'controls-container',
                        child: Widget.Switch({
                            class_name: 'menu-switch nightlight',
                            cursor: 'pointer',
                            hexpand: true,
                            hpack: 'end',
                            active: nightlight.bind('enabled'),
                            on_activate: ({ active }) => (nightlight.enabled = active)
                        }),
                    }),
                ]
            }),
            Widget.Box({
                class_name: 'menu-items-section',
                vpack: 'fill',
                vexpand: true,
                vertical: true,
                child: Widget.Box({
                    class_name: 'nightlight-container',
                    children: [
                        Widget.Icon({
                            vexpand: true,
                            vpack: 'center',
                            class_name: 'nightlight-slider-icon',
                            icon: icons.brightness.nightlight,
                        }),
                        CustomSlider(),
                        Widget.Label({
                            vpack: 'center',
                            vexpand: true,
                            class_name: 'nightlight-slider-label',
                            label: slider_value.bind().as((p) => `${Math.round(p * 100)}%`),
                        }),
                    ],
                }),
            }),
        ],
    });
};


export { Nightlight };