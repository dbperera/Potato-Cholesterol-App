async function GetPatientList()
{
    const Patients = await RetrievePatients();
    BuildPatientTable(Patients);
}

async function GetCholesterolData(Patient)
{
    const CholesterolData = await RetrieveCholesterolData(Patient); // 2 inputs 3 outputs
    BuildCholesterolTable(CholesterolData);
}

async function RetrievePatients()
{
    const PractitionerID = document.getElementById('IDNumber').value;
    const data = await fetch(`https://fhir.monash.edu/hapi-fhir-jpaserver/fhir/Encounter?_pretty=true&_count=1000&practitioner=${PractitionerID}&_format=json`).then(data => data.json());
    const PatientIDs = [];
    data.entry.forEach(element => {
        PatientID = element.resource.subject.reference.replace('Patient/', '');
        NewPatient = true;
        index = 0;
        while (NewPatient == true && index < PatientIDs.length)
        {
            if (PatientIDs[index][0] == PatientID)
            {
                NewPatient = false;
            }
            index++
        }

        if (NewPatient)
        {
            PatientName = element.resource.subject.display.replace(/[0-9]+/g, "");
            PatientIDs.push([PatientID, PatientName]);
        }
    });
    return PatientIDs;
};

async function RetrieveCholesterolData(Patient)
{
    PatientID = Patient[0];
    PatientName = Patient[1];
    var FHIR_URL = "https://fhir.monash.edu/hapi-fhir-jpaserver/fhir/DiagnosticReport?_pretty=true&patient=" + PatientID;

    const Entries = [];
    const data = await fetch(`https://fhir.monash.edu/hapi-fhir-jpaserver/fhir/DiagnosticReport?_pretty=true&patient=${PatientID}&_format=json`).then(data => data.json());


    console.log(data.entry);
    data.entry.forEach(element =>
        {
        let Date = "";
        let TotalCholesterol = "";
        let LDLCholesterol = "";
        let HDLCholesterol = "";
        if (element.resource.code.text == "Lipid Panel")
        {
            // Fetching Date
            m = element.resource.text.div.indexOf("Issued");
            m += 16;
            while (element.resource.text.div[m] != "<")
            {
                Date += element.resource.text.div[m];
                m++;
            }

            // Fetching Total Cholestrol
            m = element.resource.text.div.indexOf("Total Cholesterol");
            m += 27;
            while (element.resource.text.div[m] != " ")
            {
                TotalCholesterol += element.resource.text.div[m];
                m++;
            }
            Entries.push([PatientName, TotalCholesterol, Date]);
        }
    });
    return Entries;
};

function PushArray(Patient)
{
    if (sessionStorage.getItem("Patients") == null)
    {
        var PatientArray = [];
        sessionStorage.setItem("Patients", JSON.stringify(PatientArray));
    }
    TempPatients = sessionStorage.getItem("Patients");
    TempPatients = JSON.parse(TempPatients);
    NewPatient = true;
    index = 0;
    while (NewPatient == true && index < TempPatients.length)
    {
        if (TempPatients[index][0] == Patient[0])
        {
            NewPatient = false;
        }
        index++
    }
    if (NewPatient)
    {
        TempPatients.push(Patient);
    }
    sessionStorage.setItem("Patients", JSON.stringify(TempPatients));
    tableBody = document.getElementById("CholesterolTableBody");
    console.log(TempPatients);
    while (tableBody.rows.length > 0)
    {
        tableBody.deleteRow(0);
    }
    for (i = 0; i < TempPatients.length; i++)
    {
        GetCholesterolData(TempPatients[i]);
    }
}

function SpliceArray(Patient)
{
    TempPatients = sessionStorage.getItem("Patients");
    TempPatients = JSON.parse(TempPatients);
    for (i = 0; i < TempPatients.length; i++)
    {
        if (TempPatients[i][0] == Patient[0])
        {
            TempPatients.splice(i, 1);
        }
    }
    sessionStorage.setItem("Patients", JSON.stringify(TempPatients));
    tableBody = document.getElementById("CholesterolTableBody");
    console.log(TempPatients);
    while (tableBody.rows.length > 0)
    {
        tableBody.deleteRow(0);
    }
    if (TempPatients.length > 0)
    {
        for (i = 0; i < TempPatients.length; i++)
        {
            GetCholesterolData(TempPatients[i]);
        }
    }
}

function BuildPatientTable(Patients)
{
    tableBody = document.getElementById("PatientTableBody");
    while (tableBody.rows.length > 0)
    {
        tableBody.deleteRow(0);
    }
    for (i = 0; i < Patients.length; i++)
    {
        row = tableBody.insertRow();
        cell = row.insertCell();
        cellcontents = document.createTextNode(Patients[i][1]);
        cell.appendChild(cellcontents);
        cell = row.insertCell();
        cellcontents = document.createTextNode(Patients[i][0]);
        cell.appendChild(cellcontents);
        cell = row.insertCell();
        cellcontents = document.createElement("INPUT");
        cellcontents.setAttribute("type", "checkbox");
        cellcontents.addEventListener('change', event => {
            if(event.target.checked)
            {
                PushArray([event.target.parentNode.previousSibling.innerHTML, event.target.parentNode.previousSibling.previousSibling.innerHTML]);
            }
            else
            {
                SpliceArray([event.target.parentNode.previousSibling.innerHTML, event.target.parentNode.previousSibling.previousSibling.innerHTML]);
            }
        });
        cell.appendChild(cellcontents);
    }
};

function BuildCholesterolTable(Entries)
{
    tableBody = document.getElementById("CholesterolTableBody");
    for (i = 0; i < Entries.length; i++)
    {
        row = tableBody.insertRow();
        cell = row.insertCell();
        text = document.createTextNode(Entries[i][0]);
        cell.appendChild(text);
        cell = row.insertCell();
        text = document.createTextNode(Entries[i][1]);
        cell.appendChild(text);
        cell = row.insertCell();
        text = document.createTextNode(Entries[i][2]);
        cell.appendChild(text);
    }
    HightlightRed(CalculateAverage(GetCholesterolValues()));
};

function GetCholesterolValues()
{
    tableBody = document.getElementById("CholesterolTableBody");
    CholesterolValues = [];
    for (i = 0; i < tableBody.rows.length; i++)
    {
        CholesterolValue = parseFloat(tableBody.rows[i].cells[1].innerHTML, 10)
        CholesterolValues.push(CholesterolValue);
    }
    return CholesterolValues;
}

function CalculateAverage(Values)
{
    if (Values.length === 0)
    {
        return 0;
    }
    Total = 0;
    for (i = 0; i < Values.length; i++)
    {
        Total += Values[i];
    }
    Average = Total/Values.length;
    return Average;
}

function UpdateThresholdValue()
{
    const Threshold = document.getElementById('ThresholdNumber').value;
    HightlightRed(CalculateAverage(GetCholesterolValues()));
    HightlightRed(Threshold);
    HighlightBlack(Threshold);
}

function HightlightRed(Value)
{
    tableBody = document.getElementById("CholesterolTableBody");
    for (i = 0; i < tableBody.rows.length; i++)
    {
        if (parseFloat(tableBody.rows[i].cells[1].innerHTML, 10) > Value)
        {
            tableBody.rows[i].style.color = "red";
        }
    }
}

function HighlightBlack(Value)
{
    Average = CalculateAverage(GetCholesterolValues());
    Threshold = Value;
    if (Average < Threshold)
    {
        Threshold = Average;
    }
    tableBody = document.getElementById("CholesterolTableBody");
    for (i = 0; i < tableBody.rows.length; i++)
    {
        if (parseFloat(tableBody.rows[i].cells[1].innerHTML, 10) < Threshold)
        {
            tableBody.rows[i].style.color = "black";
        }
    }
}

