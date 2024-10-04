import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

interface CandidateProps {
    name: string,
    summary: string,
    score: string
}

const ResultCard = (props: CandidateProps) => {
    return (
        <Card sx={{ minWidth: 275, marginTop: 5}}>
          <CardContent>
            <Typography gutterBottom sx={{ color: 'text.secondary', fontSize: 14 }}>
              Candidate
            </Typography>
            <Typography variant="h5" component="div">
              {props.name}
            </Typography>
            <Typography sx={{ color: 'text.secondary', mb: 1.5 }}>Summary</Typography>
            <Typography variant="body2">
              {props.summary}
              <br />
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small">Learn More</Button>
          </CardActions>
        </Card>
      );
}

export default ResultCard;
