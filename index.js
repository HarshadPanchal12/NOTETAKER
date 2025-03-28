const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;
const filesDir = path.join(__dirname, 'files');

// Ensure the files directory exists
if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir);
}

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    fs.readdir(filesDir, (err, files) => {
        if (err) {
            console.error('Error reading files:', err);
            return res.render('index', { notes: [] });
        }
                
        let notes = files.map(file => {
            let title = file.replace('.txt', '');
            let content = fs.readFileSync(path.join(filesDir, file), 'utf-8');
            // Split content into text and formatting
            let [description, formatting] = content.split('|||');
            let htmlDescription = description;
            if (formatting) {
                let boldRanges = JSON.parse(formatting);
                boldRanges.reverse().forEach(([start, end]) => {
                    htmlDescription = htmlDescription.slice(0, end) + '</strong>' + 
                                    htmlDescription.slice(end);
                    htmlDescription = htmlDescription.slice(0, start) + '<strong>' + 
                                    htmlDescription.slice(start);
                });
            }
            return { title, description: htmlDescription };
        });

        res.render('index', { notes });
    });
});

app.post('/add', (req, res) => {
    let title = req.body.title.trim().replace(/\s+/g, '');
    let description = req.body.description;
    let formatting = req.body.formatting || '[]';
        
    if (!title || !description) {
        return res.redirect('/');
    }

    let filePath = path.join(filesDir, `${title}.txt`);
    // Store text and formatting separated by |||
    let content = `${description}|||${formatting}`;
    fs.writeFile(filePath, content, (err) => {
        if (err) {
            console.error('Error saving note:', err);
        }
        res.redirect('/');
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});