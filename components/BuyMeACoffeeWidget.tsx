import React, { useEffect } from 'react';

interface BuyMeACoffeeWidgetProps {
  offsetBottom?: number;
}

export const BuyMeACoffeeWidget: React.FC<BuyMeACoffeeWidgetProps> = ({ offsetBottom = 18 }) => {
  useEffect(() => {
    // Remove any existing widget first to prevent duplicates
    const existingScript = document.querySelector('script[data-name="BMC-Widget"]');
    if (existingScript) existingScript.remove();
    const existingWidget = document.querySelector('#bmc-wbtn');
    if (existingWidget) existingWidget.remove();

    const script = document.createElement('script');
    script.setAttribute('data-name', 'BMC-Widget');
    script.setAttribute('data-cfasync', 'false');
    script.src = 'https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js';
    script.setAttribute('data-id', 'zippytype');
    script.setAttribute('data-description', 'Support me on Buy me a coffee!');
    script.setAttribute('data-message', 'Thanks for buying me a coffee! You will get a shoutout!');
    script.setAttribute('data-color', '#FF5F5F');
    script.setAttribute('data-position', 'Right');
    script.setAttribute('data-x_margin', '18');
    script.setAttribute('data-y_margin', offsetBottom.toString());
    script.async = true;

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      const widget = document.querySelector('#bmc-wbtn');
      if (widget) widget.remove();
    };
  }, [offsetBottom]);

  return null;
};
