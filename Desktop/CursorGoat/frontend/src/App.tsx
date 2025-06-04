import React, { useState, useEffect } from 'react';
import {
  ChakraProvider,
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Textarea,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Progress,
  Divider,
  Tab,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  useToast,
  Icon,
  Container,
  Stack
} from '@chakra-ui/react';
import {
  FaSearch,
  FaGavel,
  FaExclamationTriangle,
  FaCheckCircle,
  FaFileUpload,
  FaChartBar,
  FaBook,
  FaBrain,
  FaClock,
  FaTruck,
  FaUser
} from 'react-icons/fa';
import axios from 'axios';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Types TypeScript
interface Infraction {
  id: number;
  code_infraction: string;
  libelle: string;
  categorie: 'majeure' | 'mineure' | 'administrative';
  gravite: number;
  description_detaillee: string;
  type_infraction?: string;
  articles_applicables?: string[];
  sanctions?: any[];
  detectabilite_tachygraphe: boolean;
}

interface AnalyseSituation {
  infractions_detectees: Infraction[];
  recommandations: string[];
  procedure_a_suivre: string[];
  sanctions_encourues: any[];
  degre_certitude: number;
}

interface DashboardStats {
  infractions_par_categorie: Record<string, number>;
  distribution_gravite: Record<string, number>;
  articles_plus_references: Array<{
    code_article: string;
    source_juridique: string;
    nb_references: number;
  }>;
  dernieres_mises_a_jour: Array<{
    titre: string;
    source: string;
    date_publication: string;
    statut: string;
  }>;
}

// Composant principal
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Infraction[]>([]);
  const [selectedInfraction, setSelectedInfraction] = useState<Infraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyseSituation, setAnalyseSituation] = useState('');
  const [analyseResult, setAnalyseResult] = useState<AnalyseSituation | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [filters, setFilters] = useState({
    categorie: '',
    gravite_min: '',
    gravite_max: '',
    detectabilite: ''
  });

  const toast = useToast();

  // Chargement des statistiques au démarrage
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/statistiques/dashboard');
      setDashboardStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const searchInfractions = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        q: searchQuery,
        limit: '20'
      });

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await api.get(`/infractions/search?${params}`);
      setSearchResults(response.data);
      
      toast({
        title: 'Recherche effectuée',
        description: `${response.data.length} infractions trouvées`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur recherche:', error);
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible d\'effectuer la recherche',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const analyserSituation = async () => {
    if (!analyseSituation.trim()) return;

    try {
      setLoading(true);
      const response = await api.post('/analyse/situation', {
        description_situation: analyseSituation
      });
      setAnalyseResult(response.data);

      toast({
        title: 'Analyse terminée',
        description: `${response.data.infractions_detectees.length} infractions détectées`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur analyse:', error);
      toast({
        title: 'Erreur d\'analyse',
        description: 'Impossible d\'analyser la situation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getInfractionDetails = async (code: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/infractions/${code}`);
      setSelectedInfraction(response.data);
    } catch (error) {
      console.error('Erreur détails infraction:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails de l\'infraction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Composants de rendu
  const renderDashboard = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="blue.600">
        <Icon as={FaChartBar} mr={3} />
        Tableau de Bord
      </Heading>

      {dashboardStats && (
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          {/* Statistiques générales */}
          <Card>
            <CardHeader>
              <Heading size="md">Infractions par Catégorie</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {Object.entries(dashboardStats.infractions_par_categorie).map(([categorie, count]) => (
                  <Flex key={categorie} justify="space-between" align="center">
                    <Text textTransform="capitalize">{categorie}</Text>
                    <Badge 
                      colorScheme={
                        categorie === 'majeure' ? 'red' : 
                        categorie === 'mineure' ? 'orange' : 'blue'
                      }
                    >
                      {count}
                    </Badge>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Distribution par Gravité</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                {Object.entries(dashboardStats.distribution_gravite).map(([gravite, count]) => (
                  <Flex key={gravite} justify="space-between" align="center">
                    <HStack>
                      <Text>Niveau {gravite}</Text>
                      <Progress 
                        value={(count / Math.max(...Object.values(dashboardStats.distribution_gravite))) * 100} 
                        size="sm" 
                        colorScheme="red"
                        width="100px"
                      />
                    </HStack>
                    <Badge colorScheme="gray">{count}</Badge>
                  </Flex>
                ))}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Articles les Plus Référencés</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {dashboardStats.articles_plus_references.slice(0, 5).map((article) => (
                  <Box key={article.code_article} p={2} bg="gray.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold">{article.code_article}</Text>
                    <Text fontSize="xs" color="gray.600">{article.source_juridique}</Text>
                    <Badge size="sm" colorScheme="green">{article.nb_references} réf.</Badge>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">Dernières Mises à Jour</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                {dashboardStats.dernieres_mises_a_jour.slice(0, 3).map((update, index) => (
                  <Box key={index} p={2} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="bold" noOfLines={2}>
                      {update.titre}
                    </Text>
                    <Text fontSize="xs" color="gray.600">{update.source}</Text>
                    <Badge 
                      size="sm" 
                      colorScheme={update.statut === 'intégré' ? 'green' : 'orange'}
                    >
                      {update.statut}
                    </Badge>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </Grid>
      )}
    </VStack>
  );

  const renderSearch = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="blue.600">
        <Icon as={FaSearch} mr={3} />
        Recherche d'Infractions
      </Heading>

      {/* Barre de recherche */}
      <Card>
        <CardBody>
          <VStack spacing={4}>
            <HStack width="100%">
              <Input
                placeholder="Rechercher une infraction (ex: temps de conduite, repos, tachygraphe...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchInfractions()}
                size="lg"
              />
              <Button
                colorScheme="blue"
                onClick={searchInfractions}
                isLoading={loading}
                leftIcon={<FaSearch />}
                size="lg"
              >
                Rechercher
              </Button>
            </HStack>

            {/* Filtres */}
            <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4} width="100%">
              <Select
                placeholder="Catégorie"
                value={filters.categorie}
                onChange={(e) => setFilters({...filters, categorie: e.target.value})}
              >
                <option value="majeure">Majeure</option>
                <option value="mineure">Mineure</option>
                <option value="administrative">Administrative</option>
              </Select>

              <Select
                placeholder="Gravité min"
                value={filters.gravite_min}
                onChange={(e) => setFilters({...filters, gravite_min: e.target.value})}
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>

              <Select
                placeholder="Gravité max"
                value={filters.gravite_max}
                onChange={(e) => setFilters({...filters, gravite_max: e.target.value})}
              >
                {[1,2,3,4,5].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>

              <Select
                placeholder="Détectable par tachygraphe"
                value={filters.detectabilite}
                onChange={(e) => setFilters({...filters, detectabilite: e.target.value})}
              >
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </Select>
            </Grid>
          </VStack>
        </CardBody>
      </Card>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Résultats ({searchResults.length})</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              {searchResults.map((infraction) => (
                <Box
                  key={infraction.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="lg"
                  width="100%"
                  cursor="pointer"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => getInfractionDetails(infraction.code_infraction)}
                >
                  <Flex justify="space-between" align="start">
                    <VStack align="start" flex={1}>
                      <HStack>
                        <Badge colorScheme="blue">{infraction.code_infraction}</Badge>
                        <Badge 
                          colorScheme={
                            infraction.categorie === 'majeure' ? 'red' : 
                            infraction.categorie === 'mineure' ? 'orange' : 'blue'
                          }
                        >
                          {infraction.categorie}
                        </Badge>
                        <Badge colorScheme="gray">Gravité {infraction.gravite}</Badge>
                      </HStack>
                      <Text fontWeight="bold">{infraction.libelle}</Text>
                      <Text fontSize="sm" color="gray.600" noOfLines={2}>
                        {infraction.description_detaillee}
                      </Text>
                    </VStack>
                    <VStack spacing={1}>
                      {infraction.detectabilite_tachygraphe && (
                        <Badge colorScheme="green" size="sm">Détectable</Badge>
                      )}
                      {infraction.articles_applicables && infraction.articles_applicables.length > 0 && (
                        <Badge colorScheme="purple" size="sm">
                          {infraction.articles_applicables.length} articles
                        </Badge>
                      )}
                    </VStack>
                  </Flex>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Détails d'infraction sélectionnée */}
      {selectedInfraction && (
        <Card>
          <CardHeader>
            <HStack>
              <Heading size="md">Détails de l'Infraction</Heading>
              <Badge colorScheme="blue">{selectedInfraction.code_infraction}</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontWeight="bold" fontSize="lg">{selectedInfraction.libelle}</Text>
                <Text mt={2}>{selectedInfraction.description_detaillee}</Text>
              </Box>

              <Divider />

              <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                <Stat>
                  <StatLabel>Catégorie</StatLabel>
                  <StatNumber textTransform="capitalize">{selectedInfraction.categorie}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Gravité</StatLabel>
                  <StatNumber>{selectedInfraction.gravite}/5</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>Détectable Tachygraphe</StatLabel>
                  <StatNumber>
                    {selectedInfraction.detectabilite_tachygraphe ? (
                      <Text color="green.500">Oui</Text>
                    ) : (
                      <Text color="red.500">Non</Text>
                    )}
                  </StatNumber>
                </Stat>
              </Grid>

              {selectedInfraction.articles_applicables && selectedInfraction.articles_applicables.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Articles de loi applicables :</Text>
                  <HStack wrap="wrap">
                    {selectedInfraction.articles_applicables.map((article) => (
                      <Badge key={article} colorScheme="purple">{article}</Badge>
                    ))}
                  </HStack>
                </Box>
              )}

              {selectedInfraction.sanctions && selectedInfraction.sanctions.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Sanctions encourues :</Text>
                  <VStack align="stretch" spacing={2}>
                    {selectedInfraction.sanctions.map((sanction, index) => (
                      <Box key={index} p={3} bg="red.50" borderRadius="md">
                        <Text fontWeight="bold">{sanction.type_sanction}</Text>
                        {sanction.montant_min && (
                          <Text fontSize="sm">
                            Montant: {sanction.montant_min}€ - {sanction.montant_max}€
                          </Text>
                        )}
                        {sanction.points_permis > 0 && (
                          <Text fontSize="sm">Points: {sanction.points_permis}</Text>
                        )}
                        {sanction.conditions_application && (
                          <Text fontSize="sm" color="gray.600">
                            {sanction.conditions_application}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );

  const renderAnalyseIA = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="blue.600">
        <Icon as={FaBrain} mr={3} />
        Analyse Intelligente de Situation
      </Heading>

      <Card>
        <CardHeader>
          <Heading size="md">Décrivez votre situation</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <Textarea
              placeholder="Décrivez la situation à analyser (ex: Un conducteur a conduit 11 heures consécutives sans pause, avec un repos de seulement 8 heures...)"
              value={analyseSituation}
              onChange={(e) => setAnalyseSituation(e.target.value)}
              rows={6}
              resize="vertical"
            />
            <Button
              colorScheme="purple"
              onClick={analyserSituation}
              isLoading={loading}
              leftIcon={<FaBrain />}
              isDisabled={!analyseSituation.trim()}
              size="lg"
            >
              Analyser la Situation
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {analyseResult && (
        <VStack spacing={6}>
          {/* Score de certitude */}
          <Card width="100%">
            <CardBody>
              <VStack spacing={3}>
                <Text fontWeight="bold">Degré de certitude de l'analyse</Text>
                <Progress
                  value={analyseResult.degre_certitude * 100}
                  size="lg"
                  colorScheme={
                    analyseResult.degre_certitude > 0.8 ? 'green' :
                    analyseResult.degre_certitude > 0.5 ? 'orange' : 'red'
                  }
                  width="100%"
                />
                <Text fontSize="lg" fontWeight="bold">
                  {Math.round(analyseResult.degre_certitude * 100)}%
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Infractions détectées */}
          {analyseResult.infractions_detectees.length > 0 && (
            <Card width="100%">
              <CardHeader>
                <HStack>
                  <Icon as={FaExclamationTriangle} color="red.500" />
                  <Heading size="md">Infractions Détectées ({analyseResult.infractions_detectees.length})</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  {analyseResult.infractions_detectees.map((infraction, index) => (
                    <Alert key={index} status="error" borderRadius="lg">
                      <AlertIcon />
                      <Box flex={1}>
                        <AlertTitle>{infraction.libelle}</AlertTitle>
                        <AlertDescription>
                          {infraction.description_detaillee}
                        </AlertDescription>
                        <HStack mt={2}>
                          <Badge colorScheme="red">Gravité {infraction.gravite}</Badge>
                          <Badge colorScheme="blue">{infraction.code_infraction}</Badge>
                        </HStack>
                      </Box>
                    </Alert>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Recommandations */}
          {analyseResult.recommandations.length > 0 && (
            <Card width="100%">
              <CardHeader>
                <HStack>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Heading size="md">Recommandations</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={2}>
                  {analyseResult.recommandations.map((recommendation, index) => (
                    <HStack key={index} align="start">
                      <Icon as={FaCheckCircle} color="green.500" mt={1} />
                      <Text>{recommendation}</Text>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Procédure à suivre */}
          {analyseResult.procedure_a_suivre.length > 0 && (
            <Card width="100%">
              <CardHeader>
                <HStack>
                  <Icon as={FaGavel} color="blue.500" />
                  <Heading size="md">Procédure à Suivre</Heading>
                </HStack>
              </CardHeader>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {analyseResult.procedure_a_suivre.map((etape, index) => (
                    <HStack key={index} align="start">
                      <Badge colorScheme="blue" borderRadius="full" px={2}>
                        {index + 1}
                      </Badge>
                      <Text>{etape}</Text>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {analyseResult.infractions_detectees.length === 0 && (
            <Alert status="success" borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Aucune infraction détectée!</AlertTitle>
                <AlertDescription>
                  La situation décrite ne semble pas contenir d'infractions aux règlements tachygraphiques.
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      )}
    </VStack>
  );

  const renderUploadAnalysis = () => (
    <VStack spacing={6} align="stretch">
      <Heading size="lg" color="blue.600">
        <Icon as={FaFileUpload} mr={3} />
        Analyse de Fichiers Tachygraphiques
      </Heading>

      <Card>
        <CardBody>
          <VStack spacing={4}>
            <Icon as={FaFileUpload} boxSize={12} color="gray.400" />
            <Text textAlign="center" color="gray.600">
              Glissez-déposez vos fichiers tachygraphiques (.ddd, .tgd, .esm) ici
            </Text>
            <Button colorScheme="blue" size="lg">
              Sélectionner des fichiers
            </Button>
          </VStack>
        </CardBody>
      </Card>

      <Alert status="info" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>Fonctionnalité en développement</AlertTitle>
          <AlertDescription>
            L'upload et l'analyse automatique de fichiers tachygraphiques sera disponible prochainement.
            Cette fonctionnalité permettra de détecter automatiquement les infractions dans vos données.
          </AlertDescription>
        </Box>
      </Alert>
    </VStack>
  );

  return (
    <ChakraProvider>
      <Box bg="gray.50" minH="100vh">
        <Container maxW="container.xl" py={8}>
          {/* Header */}
          <VStack spacing={6} mb={8}>
            <HStack spacing={4}>
              <Icon as={FaTruck} boxSize={8} color="blue.600" />
              <VStack align="start" spacing={0}>
                <Heading color="blue.600">Base de Données Juridique Tachygraphique</Heading>
                <Text color="gray.600">Sogestmatic - Assistant Intelligent</Text>
              </VStack>
            </HStack>
          </VStack>

          {/* Navigation */}
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed" mb={6}>
            <TabList>
              <Tab><Icon as={FaChartBar} mr={2} />Tableau de Bord</Tab>
              <Tab><Icon as={FaSearch} mr={2} />Recherche</Tab>
              <Tab><Icon as={FaBrain} mr={2} />Analyse IA</Tab>
              <Tab><Icon as={FaFileUpload} mr={2} />Upload & Analyse</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>{renderDashboard()}</TabPanel>
              <TabPanel>{renderSearch()}</TabPanel>
              <TabPanel>{renderAnalyseIA()}</TabPanel>
              <TabPanel>{renderUploadAnalysis()}</TabPanel>
            </TabPanels>
          </Tabs>

          {/* Loader global */}
          {loading && (
            <Flex justify="center" mt={8}>
              <Spinner size="xl" color="blue.500" />
            </Flex>
          )}
        </Container>
      </Box>
    </ChakraProvider>
  );
};

export default App; 