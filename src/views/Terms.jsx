import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { FileText } from 'lucide-react';

const Terms = () => {
  useSEO({
    title: 'Услови за користење | MKD Slidea',
    description: 'Услови за користење на MKD Slidea — правила, ограничувања и одговорности при користење на платформата.',
    path: '/terms',
  });

  const lastUpdated = '5 јуни 2026';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 md:p-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-violet-100 rounded-2xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Услови за користење</h1>
              <p className="text-sm text-slate-400 font-bold mt-1">Последно ажурирање: {lastUpdated}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-[15px] leading-relaxed text-slate-600">

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">1. Прифаќање на условите</h2>
              <p>Со користење на MKD Slidea (<a href="https://slidea.mismath.net" className="text-indigo-600 font-bold hover:underline">slidea.mismath.net</a>) ги прифаќате овие услови. Ако не се согласувате, не ја користете платформата.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">2. Опис на услугата</h2>
              <p>MKD Slidea е онлајн платформа за создавање интерактивни презентации со анкети, квизови, word cloud и Q&A активности. Достапна е преку веб-прелистувач без потреба за инсталација.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">3. Кориснички сметки</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Мора да имате најмалку 16 години за да создадете сметка</li>
                <li>Одговорни сте за безбедноста на вашата лозинка</li>
                <li>Не смеете да ги споделувате пристапните податоци</li>
                <li>Секое незаконско или злоупотребувачко користење ќе резултира со суспензија</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">4. Дозволена употреба</h2>
              <p>Платформата смее да се користи само за легитимни образовни, деловни и организациски цели. Забрането е:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Создавање содржини кои промовираат омраза, насилство или дискриминација</li>
                <li>Собирање лични податоци на учесниците без нивна согласност</li>
                <li>Злоупотреба на API или покушај за заобиколување на безбедносните мерки</li>
                <li>Автоматско испраќање спам одговори</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">5. Планови и наплата</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Бесплатен план:</strong> до 200 учесници по настан, до 5 активни настани</li>
                <li><strong>Платени планови:</strong> наплата преку Stripe, автоматска обнова освен ако не се откаже</li>
                <li><strong>Поврат:</strong> во рок од 14 дена по купување ако планот не е искористен</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">6. Сопственост на содржина</h2>
              <p>Вие ја задржувате сопственоста на сите прашања, одговори и настани создадени на платформата. MKD Slidea нема право да ги користи вашите содржини за цели освен за функционирање на услугата.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">7. Достапност на услугата</h2>
              <p>Настојуваме да обезбедиме 99%+ достапност, но не гарантираме непречено работење. Планираното одржување ќе биде најавено однапред.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">8. Ограничување на одговорност</h2>
              <p>MKD Slidea не е одговорна за индиректни, случајни или последователни штети настанати од употребата или неможноста за употреба на платформата.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">9. Промени на условите</h2>
              <p>Задржуваме право да ги изменуваме условите. Корисниците ќе бидат известени преку е-пошта при значителни промени.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">10. Меродавно право</h2>
              <p>Овие услови се уредуваат со законодавството на Република Северна Македонија. Споровите ќе се решаваат пред надлежниот суд во Скопје.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">11. Контакт</h2>
              <p>Прашања за условите: <a href="mailto:support@slidea.mismath.net" className="text-indigo-600 font-bold hover:underline">support@slidea.mismath.net</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
