export default function maakMailInhoud(naam: string, polisnummer: string, oudBedrag: string, nieuwBedrag: string, prolongatieDatum: string, deadlineDatum: string) {
    return `<div class="header">
<p>Beste meneer/mevrouw,</p>
</div>
<p>${naam} heeft via uw kantoor bij ons een Aansprakelijkheidsverzekering voor bedrijven lopen onder het polisnummer, ${polisnummer}. Hierbij informeren wij u over een belangrijke wijziging in deze aansprakelijkheidsverzekering voor bedrijven.</p>
<p>${prolongatieDatum} verhogen wij het verzekerd bedrag naar € 2.500.000 per aanspraak, met een maximum van € 5.000.000 per jaar. Wij ervaren dat een verzekerd bedrag van € 1.250.000 steeds vaker niet voldoende is. Daarom bieden wij deze mogelijkheid niet meer aan.</p>
<div class="bold-header"><strong>Waarom is het verzekerd bedrag vaak niet meer voldoende?</strong></div>
<p>De schadebedragen zijn flink toegenomen, zeker bij ernstig letsel of overlijden. Dit komt bijvoorbeeld door verruiming van wet- en regelgeving voor vergoeding van affectie- en shockschade, toegenomen inflatie en afnemende overheidsvoorzieningen.</p>
<p>Als het volledige verzekerd bedrag is uitgekeerd, stopt de schadevergoedingsplicht van de verzekeraar. De schadelijdende partij kan nog steeds de schade vorderen die boven het verzekerd bedrag uitkomt. Dit bedrag kan de schadelijdende partij dan direct bij de verzekerde zelf opeisen. Door het verhogen van het verzekerd bedrag kunnen wij onze verzekerden meer zekerheid bieden voor de gevolgen van hogere schadeclaims.</p>
<div class="bold-header"><strong>Aanpassing verzekerd bedrag</strong></div>
<p>Per ${prolongatieDatum} verhogen wij de verzekerde som naar € 2.500.000. De huidige premie wordt door deze aanpassing verhoogd van € ${oudBedrag} naar € ${nieuwBedrag} (per jaar, excl. assurantiebelasting).</p>
<div class="bold-header"><strong>Wat vragen wij van u?</strong></div>
<p>Wij vragen u om deze aanpassing zorgvuldig met de verzekerde door te nemen. Wanneer de verzekeringnemer niet akkoord is met de aanpassing, ontvangen wij graag voor ${deadlineDatum} een email van u met daarin een door de verzekeringnemer ondertekende verklaring waarin vermeld staat dat de verzekeringnemer niet akkoord gaat met de aanpassing, en zich bewust is van de daaruit voortvloeiende risico's.</p>
<p>In de bijlage vindt u een verklaring die u kunt gebruiken om vast te leggen dat de verzekerde het verzekerd bedrag niet wenst te verhogen.</p>
<p>Indien wij voor ${deadlineDatum} geen reactie ontvangen, gaan wij ervan uit dat onze voorgenomen wijziging akkoord is en zullen we de polis per ${prolongatieDatum} aanpassen.</p>
<div class="bold-header"><strong>Hebt u nog vragen?</strong></div>
<p>Bel ons gerust. Op werkdagen tussen 08.00 en 17.30 uur zijn wij bereikbaar op 030 257 47 56. Of chat met ons op Cockpit.</p>
<div class="signature">
<p>Met vriendelijke groet,<br />a.s.r. team acceptatie AVB en Rechtsbijstand<br />Telefoon 030 257 47 56</p>
</div>
<div class="footer">
<p><strong class="small-text">a.s.r.</strong><br /><span class="small-text">www.asr.nl</span><br /><span class="small-text">KvK 30031823</span></p>
</div>`;
}