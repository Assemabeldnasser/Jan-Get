"use client";

import Link from "next/link";

import { useLanguage } from "@/components/LanguageProvider";

const policyTranslations = {
  en: {
    back: "← Back to shop",
    title: "Store Policy",
    intro:
      "At JAN-GET, every product is prepared with care and, where applicable, printed specifically for your order. Please read the following policy before placing your order.",

    orderingTitle: "1. Orders",
    orderingText:
      "When you place an order, you are submitting a request to purchase the selected products and options. Please carefully check the product, color, size, quantity, personalization details and delivery information before completing your order.",

    personalizationTitle: "2. Personalized & Made-to-Order Products",
    personalizationText:
      "Some JAN-GET products may be produced or personalized specifically according to your selected options, such as color, size, name, age, text or other custom information.",
    personalizationBullet1:
      "Please make sure that all information entered in custom fields is correct before completing your order.",
    personalizationBullet2:
      "We are not responsible for spelling mistakes or incorrect information entered by the customer.",
    personalizationBullet3:
      "Because personalized or made-to-order products may be prepared specifically for your order, the statutory right of withdrawal may not apply where an applicable legal exception for clearly personalized or made-to-order goods applies.",

    cancellationTitle: "3. Order Cancellation",
    cancellationText:
      "Cancellation is available only while the order is still in a stage where production has not started.",
    cancellationBullet1:
      "Pending Payment orders may be cancelled while they have not entered production.",
    cancellationBullet2:
      "Once an order reaches Processing, cancellation through the website is no longer possible.",
    cancellationBullet3:
      "Processing means that the order has entered our preparation or production workflow and may already be printed or prepared specifically for you.",
    cancellationBullet4:
      "If you need help with an order, please contact Support as soon as possible. We will check the order status and let you know what options are available.",

    returnsTitle: "4. Returns & Right of Withdrawal",
    returnsText:
      "Because many JAN-GET products are printed or prepared specifically according to the customer's selected options, returns are not accepted simply because the customer changes their mind where the applicable legal exception for personalized or made-to-order goods applies.",
    returnsBullet1:
      "For standard non-personalized products, any applicable statutory right of withdrawal remains unaffected.",
    returnsBullet2:
      "Where a statutory right of withdrawal applies, the applicable legal withdrawal period and requirements will apply.",
    returnsBullet3:
      "Personalized or clearly made-to-order products may be excluded from the statutory right of withdrawal where the applicable legal conditions are met.",
    returnsBullet4:
      "Nothing in this policy limits any mandatory consumer rights that cannot legally be excluded.",

    damagedTitle: "5. Damaged, Defective or Incorrect Products",
    damagedText:
      "We want every order to arrive in the condition you expect. If your product arrives damaged, defective, materially different from what you ordered, or otherwise does not conform to the contract, please contact us as soon as possible.",
    damagedBullet1:
      "Please provide your order number and clear photographs showing the issue.",
    damagedBullet2:
      "Do not throw away the product or packaging before we have had an opportunity to review the issue, unless doing so is reasonably necessary for safety.",
    damagedBullet3:
      "After reviewing the case, we may offer an appropriate remedy such as repair, replacement, price reduction or refund, depending on the circumstances and applicable law.",
    damagedBullet4:
      "Where applicable statutory consumer rights apply, those rights take priority over this policy.",

    productTitle: "6. Product Appearance & 3D Printing",
    productText:
      "3D-printed products are produced layer by layer. Small variations in surface texture, layer lines, color appearance, dimensions or finishing may occur and can be part of the manufacturing process.",
    productBullet1:
      "Colors may appear slightly different depending on the customer's screen and lighting conditions.",
    productBullet2:
      "Minor layer lines or small manufacturing marks may occur.",
    productBullet3:
      "Such normal manufacturing characteristics do not automatically constitute a defect.",

    pricingTitle: "7. Prices & Product Options",
    pricingText:
      "The price shown at checkout is the price applicable to the selected product options at the time the order is placed.",
    pricingBullet1:
      "Different colors, sizes or personalization options may have different prices.",
    pricingBullet2:
      "The final price is displayed before the order is submitted.",
    pricingBullet3:
      "We reserve the right to correct obvious pricing or technical errors before accepting an order.",

    paymentTitle: "8. Payment",
    paymentText:
      "Orders must be successfully paid through the payment methods offered during checkout before production or fulfillment begins, unless otherwise stated.",
    paymentBullet1:
      "If payment fails or is not completed, the order may remain unpaid and may be cancelled.",
    paymentBullet2:
      "An order is not considered fully confirmed until the payment process has been successfully completed.",

    shippingTitle: "9. Shipping & Delivery",
    shippingText:
      "We currently provide shipping within Germany according to the shipping options shown during checkout.",
    shippingBullet1:
      "Estimated delivery times are provided for guidance and may vary depending on production, fulfillment and the carrier.",
    shippingBullet2:
      "Please make sure that the shipping address entered during checkout is complete and correct.",
    shippingBullet3:
      "Additional costs or delays caused by incorrect address information may be the responsibility of the customer where permitted by law.",

    customerTitle: "10. Customer Responsibilities",
    customerText:
      "Customers are responsible for providing accurate information during checkout, including their name, shipping address and any personalization information.",
    customerBullet1:
      "Please review all information before submitting the order.",
    customerBullet2:
      "If you notice an error, contact Support immediately.",
    customerBullet3:
      "We cannot guarantee that changes can be made after production has started.",

    supportTitle: "11. Support",
    supportText:
      "If you have a question about an order, product, payment, delivery or a damaged item, please contact our Support team.",
    supportLink: "Go to Support",

    legalTitle: "12. Legal Rights",
    legalText:
      "This policy is intended to explain how JAN-GET handles orders, cancellations, personalized products and returns. It does not remove or reduce any mandatory rights granted to consumers under applicable German or European law.",

    lastUpdated: "Last updated: September 2026",
  },

  de: {
    back: "← Zurück zum Shop",
    title: "Shop-Richtlinien",
    intro:
      "Bei JAN-GET wird jedes Produkt sorgfältig hergestellt und, soweit zutreffend, speziell für Ihre Bestellung gedruckt. Bitte lesen Sie diese Richtlinien vor Ihrer Bestellung.",

    orderingTitle: "1. Bestellungen",
    orderingText:
      "Mit dem Absenden einer Bestellung geben Sie eine Anfrage zum Kauf der ausgewählten Produkte und Optionen ab. Bitte prüfen Sie Produkt, Farbe, Größe, Menge, Personalisierungsangaben und Lieferadresse sorgfältig vor Abschluss der Bestellung.",

    personalizationTitle: "2. Personalisierte & auf Bestellung gefertigte Produkte",
    personalizationText:
      "Einige JAN-GET-Produkte werden entsprechend Ihren ausgewählten Optionen speziell für Ihre Bestellung hergestellt oder personalisiert, zum Beispiel nach Farbe, Größe, Name, Alter, Text oder anderen individuellen Angaben.",
    personalizationBullet1:
      "Bitte überprüfen Sie alle Angaben in den benutzerdefinierten Feldern vor Abschluss der Bestellung.",
    personalizationBullet2:
      "Für Tippfehler oder falsche Angaben, die vom Kunden eingegeben wurden, sind wir nicht verantwortlich.",
    personalizationBullet3:
      "Da personalisierte oder speziell angefertigte Produkte individuell für Ihre Bestellung hergestellt werden können, kann das gesetzliche Widerrufsrecht ausgeschlossen sein, soweit eine gesetzlich anwendbare Ausnahme für eindeutig personalisierte oder nach Kundenspezifikation angefertigte Waren vorliegt.",

    cancellationTitle: "3. Stornierung einer Bestellung",
    cancellationText:
      "Eine Stornierung ist nur möglich, solange sich die Bestellung noch in einer Phase befindet, in der die Produktion noch nicht begonnen hat.",
    cancellationBullet1:
      "Bestellungen mit dem Status „Pending Payment“ können storniert werden, solange sie noch nicht in die Produktion übergegangen sind.",
    cancellationBullet2:
      "Sobald eine Bestellung den Status „Processing“ erreicht, ist eine Stornierung über die Website nicht mehr möglich.",
    cancellationBullet3:
      "„Processing“ bedeutet, dass die Bestellung in unseren Vorbereitungs- oder Produktionsprozess übergegangen ist und möglicherweise bereits speziell für Sie gedruckt oder vorbereitet wird.",
    cancellationBullet4:
      "Wenn Sie Hilfe zu einer Bestellung benötigen, kontaktieren Sie den Support so schnell wie möglich. Wir prüfen den Bestellstatus und informieren Sie über die verfügbaren Möglichkeiten.",

    returnsTitle: "4. Rückgabe & Widerrufsrecht",
    returnsText:
      "Da viele JAN-GET-Produkte speziell nach den vom Kunden ausgewählten Optionen gedruckt oder hergestellt werden, werden Rückgaben wegen einer bloßen Meinungsänderung nicht akzeptiert, soweit die gesetzliche Ausnahme für personalisierte oder nach Kundenspezifikation angefertigte Waren anwendbar ist.",
    returnsBullet1:
      "Bei standardisierten, nicht personalisierten Produkten bleiben eventuell bestehende gesetzliche Widerrufsrechte unberührt.",
    returnsBullet2:
      "Soweit ein gesetzliches Widerrufsrecht besteht, gelten die jeweils gesetzlich vorgeschriebene Widerrufsfrist und die entsprechenden Voraussetzungen.",
    returnsBullet3:
      "Personalisierte oder eindeutig nach Kundenspezifikation angefertigte Produkte können vom gesetzlichen Widerrufsrecht ausgeschlossen sein, wenn die gesetzlichen Voraussetzungen dafür erfüllt sind.",
    returnsBullet4:
      "Diese Richtlinie beschränkt keine zwingenden Verbraucherrechte, die gesetzlich nicht ausgeschlossen werden dürfen.",

    damagedTitle: "5. Beschädigte, fehlerhafte oder falsche Produkte",
    damagedText:
      "Wir möchten, dass jede Bestellung in dem erwarteten Zustand bei Ihnen ankommt. Wenn Ihr Produkt beschädigt, fehlerhaft oder wesentlich anders als bestellt ist oder anderweitig nicht dem Vertrag entspricht, kontaktieren Sie uns bitte so schnell wie möglich.",
    damagedBullet1:
      "Bitte geben Sie Ihre Bestellnummer an und senden Sie aussagekräftige Fotos des Problems.",
    damagedBullet2:
      "Bitte bewahren Sie Produkt und Verpackung auf, bis wir den Fall prüfen konnten, sofern dies nicht aus Sicherheitsgründen unzumutbar ist.",
    damagedBullet3:
      "Nach Prüfung können wir je nach Umständen und geltendem Recht eine geeignete Lösung anbieten, beispielsweise Reparatur, Ersatz, Preisminderung oder Erstattung.",
    damagedBullet4:
      "Soweit gesetzliche Verbraucherrechte gelten, haben diese Vorrang vor dieser Richtlinie.",

    productTitle: "6. Produktoptik & 3D-Druck",
    productText:
      "3D-gedruckte Produkte werden Schicht für Schicht hergestellt. Kleine Unterschiede bei Oberflächenstruktur, sichtbaren Schichten, Farbdarstellung, Abmessungen oder Nachbearbeitung können auftreten und Teil des Herstellungsprozesses sein.",
    productBullet1:
      "Farben können je nach Bildschirm und Lichtverhältnissen leicht unterschiedlich erscheinen.",
    productBullet2:
      "Kleine Schichtlinien oder geringfügige Produktionsspuren können auftreten.",
    productBullet3:
      "Solche normalen Herstellungsmerkmale stellen nicht automatisch einen Mangel dar.",

    pricingTitle: "7. Preise & Produktoptionen",
    pricingText:
      "Der an der Kasse angezeigte Preis ist der Preis für die ausgewählten Produktoptionen zum Zeitpunkt der Bestellung.",
    pricingBullet1:
      "Verschiedene Farben, Größen oder Personalisierungsoptionen können unterschiedliche Preise haben.",
    pricingBullet2:
      "Der endgültige Preis wird angezeigt, bevor die Bestellung abgeschickt wird.",
    pricingBullet3:
      "Offensichtliche Preis- oder technische Fehler können vor Annahme einer Bestellung korrigiert werden.",

    paymentTitle: "8. Zahlung",
    paymentText:
      "Bestellungen müssen über die beim Checkout angebotenen Zahlungsmethoden erfolgreich bezahlt werden, bevor die Produktion oder Bearbeitung beginnt, sofern nichts anderes angegeben ist.",
    paymentBullet1:
      "Wenn eine Zahlung fehlschlägt oder nicht abgeschlossen wird, kann die Bestellung unbezahlt bleiben und storniert werden.",
    paymentBullet2:
      "Eine Bestellung gilt erst nach erfolgreichem Abschluss des Zahlungsvorgangs als vollständig bestätigt.",

    shippingTitle: "9. Versand & Lieferung",
    shippingText:
      "Der Versand erfolgt derzeit innerhalb Deutschlands entsprechend den beim Checkout angebotenen Versandoptionen.",
    shippingBullet1:
      "Angegebene Lieferzeiten sind Richtwerte und können je nach Produktion, Bearbeitung und Versanddienstleister variieren.",
    shippingBullet2:
      "Bitte stellen Sie sicher, dass die beim Checkout angegebene Lieferadresse vollständig und korrekt ist.",
    shippingBullet3:
      "Zusätzliche Kosten oder Verzögerungen aufgrund falscher Adressangaben können, soweit gesetzlich zulässig, vom Kunden zu tragen sein.",

    customerTitle: "10. Pflichten des Kunden",
    customerText:
      "Der Kunde ist dafür verantwortlich, während des Checkouts korrekte Angaben zu machen, einschließlich Name, Lieferadresse und Personalisierungsinformationen.",
    customerBullet1:
      "Bitte prüfen Sie alle Angaben vor dem Absenden der Bestellung.",
    customerBullet2:
      "Wenn Sie einen Fehler feststellen, kontaktieren Sie den Support sofort.",
    customerBullet3:
      "Nach Beginn der Produktion können Änderungen nicht garantiert werden.",

    supportTitle: "11. Support",
    supportText:
      "Bei Fragen zu Bestellung, Produkt, Zahlung, Lieferung oder einem beschädigten Produkt können Sie unser Support-Team kontaktieren.",
    supportLink: "Zum Support",

    legalTitle: "12. Gesetzliche Rechte",
    legalText:
      "Diese Richtlinie erklärt den Umgang von JAN-GET mit Bestellungen, Stornierungen, personalisierten Produkten und Rückgaben. Sie schränkt keine zwingenden Verbraucherrechte nach dem anwendbaren deutschen oder europäischen Recht ein.",

    lastUpdated: "Letzte Aktualisierung: September 2026",
  },

  ar: {
    back: "→ العودة إلى المتجر",
    title: "سياسة المتجر",
    intro:
      "في JAN-GET نقوم بتصنيع كل منتج بعناية، وعند الحاجة تتم طباعته وتجهيزه خصيصًا وفقًا لطلبك. يرجى قراءة هذه السياسة قبل إتمام الطلب.",

    orderingTitle: "1. الطلبات",
    orderingText:
      "عند إرسال الطلب، فإنك تطلب شراء المنتجات والخيارات التي اخترتها. يرجى التأكد جيدًا من المنتج واللون والمقاس والكمية وبيانات التخصيص وعنوان الشحن قبل إتمام الطلب.",

    personalizationTitle: "2. المنتجات المخصصة والمصنوعة حسب الطلب",
    personalizationText:
      "قد يتم تصنيع أو تخصيص بعض منتجات JAN-GET خصيصًا بناءً على الاختيارات التي تحددها، مثل اللون أو المقاس أو الاسم أو العمر أو النص أو أي معلومات مخصصة أخرى.",
    personalizationBullet1:
      "يرجى التأكد من صحة جميع المعلومات التي تدخلها في الحقول المخصصة قبل إتمام الطلب.",
    personalizationBullet2:
      "نحن غير مسؤولين عن الأخطاء الإملائية أو المعلومات غير الصحيحة التي يدخلها العميل بنفسه.",
    personalizationBullet3:
      "نظرًا لأن المنتجات المخصصة أو المصنوعة حسب الطلب قد يتم تجهيزها خصيصًا لطلبك، فقد لا ينطبق حق الانسحاب القانوني عليها عندما ينطبق الاستثناء القانوني الخاص بالمنتجات المصنوعة حسب الطلب أو المخصصة بشكل واضح.",

    cancellationTitle: "3. إلغاء الطلب",
    cancellationText:
      "يمكن إلغاء الطلب فقط طالما أنه ما زال في مرحلة لم يبدأ فيها الإنتاج.",
    cancellationBullet1:
      "يمكن إلغاء الطلبات التي تحمل حالة Pending Payment طالما أنها لم تدخل مرحلة الإنتاج.",
    cancellationBullet2:
      "بمجرد وصول الطلب إلى حالة Processing، لن يكون إلغاء الطلب ممكنًا من خلال الموقع.",
    cancellationBullet3:
      "تعني حالة Processing أن الطلب دخل بالفعل في مرحلة التحضير أو الإنتاج، وقد يكون قد بدأ طباعته أو تجهيزه خصيصًا لك.",
    cancellationBullet4:
      "إذا كنت بحاجة إلى مساعدة بخصوص طلبك، يرجى التواصل مع الدعم في أسرع وقت ممكن. سنراجع حالة الطلب ونوضح لك الخيارات المتاحة.",

    returnsTitle: "4. الإرجاع وحق الانسحاب",
    returnsText:
      "نظرًا لأن العديد من منتجات JAN-GET تتم طباعتها أو تجهيزها خصيصًا وفقًا لاختيارات العميل، فلا نقبل إرجاع المنتجات لمجرد تغيير رأي العميل عندما ينطبق الاستثناء القانوني الخاص بالمنتجات المخصصة أو المصنوعة حسب الطلب.",
    returnsBullet1:
      "بالنسبة للمنتجات القياسية غير المخصصة، تظل أي حقوق قانونية سارية للانسحاب دون تغيير.",
    returnsBullet2:
      "عندما يكون هناك حق قانوني في الانسحاب، تطبق المدة والشروط التي يحددها القانون.",
    returnsBullet3:
      "قد يتم استثناء المنتجات المخصصة أو المصنوعة بوضوح حسب طلب العميل من حق الانسحاب القانوني عندما تتحقق الشروط القانونية لذلك.",
    returnsBullet4:
      "لا تهدف هذه السياسة إلى الحد من أي حقوق إلزامية للمستهلك لا يسمح القانون باستبعادها.",

    damagedTitle: "5. المنتجات التالفة أو المعيبة أو غير الصحيحة",
    damagedText:
      "نريد أن يصل كل طلب إليك بالحالة التي تتوقعها. إذا وصل المنتج تالفًا أو به عيب أو مختلفًا بشكل جوهري عن المنتج الذي طلبته أو غير مطابق للعقد، يرجى التواصل معنا في أسرع وقت ممكن.",
    damagedBullet1:
      "يرجى إرسال رقم الطلب وصور واضحة توضح المشكلة.",
    damagedBullet2:
      "يرجى الاحتفاظ بالمنتج والتغليف حتى نتمكن من مراجعة المشكلة، ما لم يكن الاحتفاظ به غير معقول لأسباب تتعلق بالسلامة.",
    damagedBullet3:
      "بعد مراجعة الحالة، قد نقدم الحل المناسب مثل الإصلاح أو الاستبدال أو تخفيض السعر أو استرداد المبلغ، حسب الحالة والقانون المطبق.",
    damagedBullet4:
      "عندما تنطبق حقوق قانونية للمستهلك، فإن هذه الحقوق لها الأولوية على هذه السياسة.",

    productTitle: "6. شكل المنتج والطباعة ثلاثية الأبعاد",
    productText:
      "يتم تصنيع المنتجات المطبوعة ثلاثية الأبعاد طبقة بعد طبقة. لذلك قد تظهر اختلافات بسيطة في ملمس السطح أو خطوط الطبقات أو شكل اللون أو الأبعاد أو التشطيب، وقد تكون هذه الاختلافات جزءًا طبيعيًا من عملية التصنيع.",
    productBullet1:
      "قد تبدو الألوان مختلفة قليلًا حسب الشاشة وظروف الإضاءة.",
    productBullet2:
      "قد تظهر خطوط بسيطة ناتجة عن طبقات الطباعة أو آثار تصنيع بسيطة.",
    productBullet3:
      "هذه الخصائص الطبيعية لعملية التصنيع لا تعتبر تلقائيًا عيبًا في المنتج.",

    pricingTitle: "7. الأسعار وخيارات المنتج",
    pricingText:
      "السعر الظاهر في صفحة الدفع هو السعر المطبق على خيارات المنتج التي اخترتها وقت إتمام الطلب.",
    pricingBullet1:
      "قد تختلف الأسعار حسب اللون أو المقاس أو خيارات التخصيص.",
    pricingBullet2:
      "يظهر السعر النهائي قبل إرسال الطلب.",
    pricingBullet3:
      "نحتفظ بالحق في تصحيح الأخطاء الواضحة في الأسعار أو الأخطاء التقنية قبل قبول الطلب.",

    paymentTitle: "8. الدفع",
    paymentText:
      "يجب إتمام دفع الطلب بنجاح باستخدام طرق الدفع المتاحة أثناء عملية الدفع قبل بدء الإنتاج أو تنفيذ الطلب، ما لم يتم توضيح خلاف ذلك.",
    paymentBullet1:
      "إذا فشلت عملية الدفع أو لم تكتمل، فقد يظل الطلب غير مدفوع ويمكن إلغاؤه.",
    paymentBullet2:
      "لا يعتبر الطلب مؤكدًا بشكل كامل إلا بعد نجاح عملية الدفع.",

    shippingTitle: "9. الشحن والتوصيل",
    shippingText:
      "نوفر حاليًا الشحن داخل ألمانيا وفق خيارات الشحن التي تظهر أثناء إتمام الطلب.",
    shippingBullet1:
      "مواعيد التوصيل المذكورة هي تقديرات وقد تختلف حسب وقت الإنتاج وتجهيز الطلب وشركة الشحن.",
    shippingBullet2:
      "يرجى التأكد من أن عنوان الشحن الذي تدخله أثناء الدفع كامل وصحيح.",
    shippingBullet3:
      "قد يتحمل العميل، بالقدر الذي يسمح به القانون، أي تكاليف أو تأخير ناتج عن إدخال عنوان غير صحيح.",

    customerTitle: "10. مسؤولية العميل",
    customerText:
      "العميل مسؤول عن تقديم معلومات صحيحة أثناء إتمام الطلب، بما في ذلك الاسم وعنوان الشحن وأي معلومات خاصة بالتخصيص.",
    customerBullet1:
      "يرجى مراجعة جميع المعلومات قبل إرسال الطلب.",
    customerBullet2:
      "إذا اكتشفت وجود خطأ، تواصل مع الدعم فورًا.",
    customerBullet3:
      "بعد بدء الإنتاج لا يمكن ضمان إمكانية تعديل الطلب.",

    supportTitle: "11. الدعم",
    supportText:
      "إذا كان لديك سؤال بخصوص طلب أو منتج أو عملية دفع أو شحن أو منتج تالف، يمكنك التواصل مع فريق الدعم.",
    supportLink: "الانتقال إلى الدعم",

    legalTitle: "12. الحقوق القانونية",
    legalText:
      "تهدف هذه السياسة إلى توضيح طريقة تعامل JAN-GET مع الطلبات والإلغاء والمنتجات المخصصة والإرجاع. ولا تهدف إلى إلغاء أو تقليل أي حقوق إلزامية للمستهلك يمنحها القانون الألماني أو الأوروبي المطبق.",

    lastUpdated: "آخر تحديث: سبتمبر 2026",
  },
};

type PolicyLanguage = keyof typeof policyTranslations;

export default function PolicyPage() {
  const { language } = useLanguage();

  const t =
    policyTranslations[
      language as PolicyLanguage
    ];

  const bulletSections = [
    {
      title:
        t.personalizationTitle,
      text:
        t.personalizationText,
      bullets: [
        t.personalizationBullet1,
        t.personalizationBullet2,
        t.personalizationBullet3,
      ],
    },
    {
      title:
        t.cancellationTitle,
      text:
        t.cancellationText,
      bullets: [
        t.cancellationBullet1,
        t.cancellationBullet2,
        t.cancellationBullet3,
        t.cancellationBullet4,
      ],
    },
    {
      title: t.returnsTitle,
      text: t.returnsText,
      bullets: [
        t.returnsBullet1,
        t.returnsBullet2,
        t.returnsBullet3,
        t.returnsBullet4,
      ],
    },
    {
      title: t.damagedTitle,
      text: t.damagedText,
      bullets: [
        t.damagedBullet1,
        t.damagedBullet2,
        t.damagedBullet3,
        t.damagedBullet4,
      ],
    },
    {
      title: t.productTitle,
      text: t.productText,
      bullets: [
        t.productBullet1,
        t.productBullet2,
        t.productBullet3,
      ],
    },
    {
      title: t.pricingTitle,
      text: t.pricingText,
      bullets: [
        t.pricingBullet1,
        t.pricingBullet2,
        t.pricingBullet3,
      ],
    },
    {
      title: t.paymentTitle,
      text: t.paymentText,
      bullets: [
        t.paymentBullet1,
        t.paymentBullet2,
      ],
    },
    {
      title: t.shippingTitle,
      text: t.shippingText,
      bullets: [
        t.shippingBullet1,
        t.shippingBullet2,
        t.shippingBullet3,
      ],
    },
    {
      title: t.customerTitle,
      text: t.customerText,
      bullets: [
        t.customerBullet1,
        t.customerBullet2,
        t.customerBullet3,
      ],
    },
  ];

  return (
    <main
      dir={
        language === "ar"
          ? "rtl"
          : "ltr"
      }
      className="min-h-screen bg-[var(--background)] px-4 py-10 text-[var(--text-primary)] sm:px-6 sm:py-14 lg:py-20"
    >
      <div className="mx-auto max-w-5xl">
        <Link
          href="/shop"
          className="inline-flex cursor-pointer items-center rounded-full border border-[var(--brand-soft)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--brand-soft)]"
        >
          {t.back}
        </Link>

        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <div className="border-b border-[var(--border)] px-6 py-8 sm:px-10 sm:py-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)] sm:text-sm">
              JAN-GET
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-[var(--text-primary)] sm:text-5xl">
              {t.title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg sm:leading-8">
              {t.intro}
            </p>
          </div>

          <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
            <section>
              <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">
                {t.orderingTitle}
              </h2>

              <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                {t.orderingText}
              </p>
            </section>

            {bulletSections.map(
              (section) => (
                <section
                  key={section.title}
                >
                  <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">
                    {section.title}
                  </h2>

                  <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                    {section.text}
                  </p>

                  <ul className="mt-4 list-disc space-y-2 ps-6 text-[var(--text-secondary)]">
                    {section.bullets.map(
                      (bullet) => (
                        <li
                          key={bullet}
                          className="leading-7"
                        >
                          {bullet}
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )
            )}

            <section>
              <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">
                {t.supportTitle}
              </h2>

              <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                {t.supportText}
              </p>

              <Link
                href="/help"
                className="mt-5 inline-flex cursor-pointer rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:opacity-90"
              >
                {t.supportLink}
              </Link>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5 sm:p-6">
              <h2 className="text-xl font-black text-[var(--text-primary)] sm:text-2xl">
                {t.legalTitle}
              </h2>

              <p className="mt-3 leading-7 text-[var(--text-secondary)]">
                {t.legalText}
              </p>
            </section>

            <p className="border-t border-[var(--border)] pt-6 text-sm text-[var(--text-muted)]">
              {t.lastUpdated}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}