import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { Shield } from 'lucide-react';

const PrivacyPolicy = () => {
  useSEO({
    title: 'Политика на приватност | MKD Slidea',
    description: 'Политика на приватност на MKD Slidea — kako gi собираме, користиме и заштитуваме вашите лични податоци.',
    path: '/privacy',
  });

  const lastUpdated = '5 јуни 2026';

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 md:p-14">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900">Политика на приватност</h1>
              <p className="text-sm text-slate-400 font-bold mt-1">Последно ажурирање: {lastUpdated}</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-[15px] leading-relaxed text-slate-600">

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">1. Кои сме ние</h2>
              <p>MKD Slidea е македонска SaaS платформа за интерактивни презентации, анкети и квизови во живо. Достапна на <a href="https://slidea.mismath.net" className="text-indigo-600 font-bold hover:underline">slidea.mismath.net</a>.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">2. Кои податоци ги собираме</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Регистрирани корисници:</strong> е-пошта, лозинка (криптирана), профилна слика (опционална)</li>
                <li><strong>Учесници на настани:</strong> одговори на анкети/квизови — само текст, анонимно (без идентификација)</li>
                <li><strong>Технички податоци:</strong> IP адреса за спречување злоупотреби, тип на уред/прелистувач</li>
                <li><strong>Колачиња (cookies):</strong> сесиски колачиња за автентикација, localStorage за офлајн функционалност</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">3. Зошто ги собираме</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Обезбедување на основните функции на платформата</li>
                <li>Управување со кориснички сметки и автентикација</li>
                <li>Пресметување на резултати во реално време</li>
                <li>Подобрување на платформата врз основа на употреба</li>
                <li>Испраќање системски е-пошти (потврда на сметка, recap по настан)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">4. Кои ги добиваат вашите податоци</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Supabase (EU региони):</strong> база на податоци и автентикација — GDPR усогласен провајдер</li>
                <li><strong>Vercel:</strong> хостинг — EU/US сервери</li>
                <li><strong>Resend:</strong> испраќање е-пошти</li>
              </ul>
              <p className="mt-3">Не продаваме и не споделуваме лични податоци со трети страни за маркетинг.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">5. Анонимност на учесниците</h2>
              <p>Учесниците на настани се приклучуваат <strong>без задолжителна регистрација</strong>. Нивните одговори се поврзани со анонимен сесиски идентификатор (UUID), не со реална личност. Домаќинот го гледа само текстот на одговорот и опционалното корисничко прекаре кое самиот учесник го внел.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">6. Вашите права (GDPR)</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Пристап:</strong> право да побарате копија на вашите податоци</li>
                <li><strong>Бришење:</strong> право да побарате бришење на сметката и сите поврзани податоци</li>
                <li><strong>Поправка:</strong> право да ги коригирате неточните информации</li>
                <li><strong>Преносливост:</strong> право да добиете податоците во машински читлив формат</li>
              </ul>
              <p className="mt-3">За остварување на правата, контактирајте нè на: <a href="mailto:support@slidea.mismath.net" className="text-indigo-600 font-bold hover:underline">support@slidea.mismath.net</a></p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">7. Безбедност на податоците</h2>
              <p>Сите комуникации се шифрирани со TLS/HTTPS. Лозинките се хашираат со bcrypt. Базата на податоци е заштитена со Row Level Security (RLS) политики на Supabase.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">8. Задржување на податоци</h2>
              <p>Кориснички сметки и настани се чуваат додека сметката е активна. По бришење на сметката, сите поврзани податоци се бришат во рок од 30 дена.</p>
            </section>

            <section>
              <h2 className="text-xl font-black text-slate-900 mb-3">9. Контакт</h2>
              <p>За прашања поврзани со приватноста: <a href="mailto:support@slidea.mismath.net" className="text-indigo-600 font-bold hover:underline">support@slidea.mismath.net</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
